const fs = require('fs');
const path = require('path');
const gpxParser = require('gpxparser');
const piexif = require('piexifjs');
const moment = require('moment');
const lib = require('./lib')

// lookup folder parameter if available otherwuse use current folder
const args = process.argv.slice(2);
const folder = path.resolve(args[0], '.');

if (!fs.existsSync(folder)) {
  console.error(`folder ${folder} does not exist!`);
  process.exit(1);
}

// lookup gpx file
const gpxFile = fs.readdirSync(folder)
  .filter(file => file.match(/\.gpx$/))
  .pop();

if (gpxFile === undefined) {
  console.error(`no gpx found in folder ${folder}!`);
  process.exit(1);
}

// parse gpx content
const gpxPath = path.join(folder, gpxFile);
const gpxContent = fs.readFileSync(gpxPath).toString();
const gpx = new gpxParser();
gpx.parse(gpxContent);

// load all img files
const imgFiles = fs.readdirSync(folder)
  .filter(file => file.match(/\.jpg$/i));

// iterate through each image file
imgFiles.forEach(imgFile => {

  // compute absolute image path
  const imgPath = path.join(folder, imgFile);

  // load exif GPS data
  const imgBinary = fs.readFileSync(imgPath).toString('binary');
  const imgExif = piexif.load(imgBinary);

  // lookup exif attributes
  const imgExifDirectionRef = imgExif.GPS[piexif.GPSIFD.GPSImgDirectionRef];
  const imgExifDirection    = imgExif.GPS[piexif.GPSIFD.GPSImgDirection];
  const imgExifLatitudeRef  = imgExif.GPS[piexif.GPSIFD.GPSLatitudeRef];
  const imgExifLatitude     = imgExif.GPS[piexif.GPSIFD.GPSLatitude];
  const imgExifLongitudeRef = imgExif.GPS[piexif.GPSIFD.GPSLongitudeRef];
  const imgExifLongitude    = imgExif.GPS[piexif.GPSIFD.GPSLongitude];
  const imgExifTimestamp    = imgExif.GPS[piexif.GPSIFD.GPSTimeStamp];
  const imgExifDatestamp    = imgExif.GPS[piexif.GPSIFD.GPSDateStamp];

  // compute direction, latitude, longitude, and timestamp based on exit attributes
  const direction = undefined; //imgExifDirection && imgExifDirectionRef ? piexif.GPSHelper.dmsRationalToDeg(imgExifDirection, imgExifDirectionRef) : undefined;
  const latitude  = imgExifLatitude  && imgExifLatitudeRef  ? piexif.GPSHelper.dmsRationalToDeg(imgExifLatitude, imgExifLatitudeRef) : undefined;
  const longitude = imgExifLongitude && imgExifLongitudeRef ? piexif.GPSHelper.dmsRationalToDeg(imgExifLongitude, imgExifLongitudeRef) : undefined;
  const hours = imgExifTimestamp ? piexif.GPSHelper.dmsRationalToDeg(imgExifTimestamp) : undefined;
  const timestamp = imgExifDatestamp ? moment.utc(imgExifDatestamp, 'YYYY:MM:DD').add(hours, 'hours') : undefined;

  // exit if mandatory attributes are missing
  if (timestamp === undefined || latitude === undefined || longitude === undefined)
    return;

  console.log(`> ${imgPath}`);

  console.log(`  ~ timestamp: ${timestamp}`);
  console.log(`  ~ latlon:    ${latitude}, ${longitude}`);
  console.log(`  ~ direction: ${direction}`);


  let previousPoint;
  // iterate through folder gpx tracks
  gpx.tracks.forEach(track => {
    // skip rest of the tracks if a segment was found earlier
    if (previousPoint === true)
      return;

    // reset previousPoint to null for initial lookup
    previousPoint = null;

    // iterate through each track points
    track.points.forEach(point => {
      // if image timestamp match segment start/end (inclusive/exclusive)
      if (previousPoint && timestamp.isBetween(previousPoint.time, point.time, undefined, '[)')) {
        // compute bearing in degrees
        const bearingDeg = lib.getBearingDeg(previousPoint.lat, previousPoint.lon, point.lat, point.lon);
        // convert to DMS rational
        const bearingDms = piexif.GPSHelper.degToDmsRational(bearingDeg);

        // overwrite image exif attributes for ImgDirection
        imgExif.GPS[piexif.GPSIFD.GPSImgDirectionRef] = 'T';
        imgExif.GPS[piexif.GPSIFD.GPSImgDirection] = bearingDms;

        // dump and insert exif data in img binary
        const imgExifBinary = piexif.dump(imgExif);
        const imgData = piexif.insert(imgExifBinary, imgBinary);

        // overwrite image file with updated exif
        const imgBuffer = Buffer.from(imgData, 'binary');
        fs.writeFileSync(imgPath, imgBuffer);

        // retain gps timestamp as creation date
        fs.utimesSync(imgPath, +new Date(), timestamp.unix());

        console.log (`  + bearing:   ${bearingDeg}º`);

        // ensure we skip the rest of the points and tracks
        previousPoint = true;
        return;
      } else {
        // save current point as previous
        previousPoint = point;
      }
    })
  })
})