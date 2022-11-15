const fs = require('fs');
const path = require('path');
const xmldom = require('xmldom');
const xpath = require('xpath');

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
`<gpx version="1.1" creator="OsmAnd 4.2.6" xmlns="http://www.topografix.com/GPX/1/1" xmlns:osmand="https://osmand.net" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.topografix.com/GPX/1/1 http://www.topografix.com/GPX/1/1/gpx.xsd">`
];

files.forEach(file => {
  console.log(`---- input ${file}`);
  const tracks = parseGPXTracks(file);
  tracks.forEach(track => {
    content.push(track);
  })
});

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

function parseGPXTracks(file) {
  const parser = new xmldom.DOMParser();
  const serializer = new xmldom.XMLSerializer();
  const xml = fs.readFileSync(file).toString();
  const gpx = parser.parseFromString(xml, 'text/xml');
  const trks = Array.from(gpx.documentElement.childNodes).filter(n => n.nodeName === 'trk').map(trk => trk.toString());
  return trks;
}