const fs = require('fs');
const path = require('path');
const xmldom = require('xmldom');
const xpath = require('xpath');
const haversine = require('haversine');
const simplify = require('@mapbox/geosimplify-js');

// lookup folder parameter if available otherwuse use current folder
const args = process.argv.slice(2);
const folder = args[0] || path.resolve('.');

if (!fs.existsSync(folder)) {
  console.error(`folder ${folder} does not exist!`);
  process.exit(1);
}

const files = listGPXFiles(folder);

const content = [
`<?xml version="1.0" encoding="UTF-8" standalone="yes" ?>`,
`<gpx version="1.1" xmlns="http://www.topografix.com/GPX/1/1">`,
`<trk>`,
];

files.forEach(file => {
  // console.log(`---- input ${file}`);
  const segments = parseGPXTrackSegments(file);
  segments.forEach(points => {
    const simplifiedPoints = simplify(points, 10, 100);
    content.push(`<trkseg>${simplifiedPoints.map(([lon, lat]) => `<trkpt lat="${lat.toFixed(4)}" lon="${lon.toFixed(4)}"/>`).join('')}</trkseg>`);
  });
});

content.push(`</trk>`);
content.push(`</gpx>`);

const target = path.join(path.dirname(folder), path.basename(folder)) + `.gpx`;
console.log(`--- output ${target}`);

fs.writeFileSync(target, content.join('\n'));

function listGPXFiles(folder) {
  const gpx = [];
  const files = fs.readdirSync(folder);

  files.forEach(filename => {
    const file = path.join(folder, filename);
    const stat = fs.lstatSync(file);
    if (stat.isDirectory()) {
      gpx.push(...listGPXFiles(file));
    } else if (file.match(/.gpx$/)) {
      gpx.push(file);
    }
  });

  return gpx;
}

function parseGPXTrackSegments(file) {
  const COORDS_DECIMALS = 4;
  const parser = new xmldom.DOMParser();
  const serializer = new xmldom.XMLSerializer();
  const xml = fs.readFileSync(file).toString();
  if (xml.length === 0)
    return [];

  const gpx = parser.parseFromString(xml, 'text/xml');
  const segments = Array
    .from(gpx.documentElement.childNodes)
    .filter(n => n.nodeName === 'trk')
    .reduce((r, trk) => {
      Array
      .from(trk.childNodes)
      .filter(n => n.nodeName === 'trkseg')
      .forEach(trkseg => {
        // parse all points in segment
        const points = Array
          .from(trkseg.childNodes)
          .filter(n => n.nodeName === 'trkpt')
          .map(trkpt => {
            const lat = parseFloat(trkpt.getAttribute('lat'));
            const lon = parseFloat(trkpt.getAttribute('lon'));
            return [ lon, lat ];
          });

        r.push([]); // init new segment

        points.forEach((point, index) => {
          const lastPoint = points[index - 1];

          if (lastPoint) {
            const distance = haversine(lastPoint, point, { format: '[lon,lat]' }) * 1000;
            if (distance > 1000)
              r.push([]);
          }

          const lastSegment = r[r.length -1];
          lastSegment.push(point)
        })

        return r;
      });
      return r;
    }, []);
  return segments;
}