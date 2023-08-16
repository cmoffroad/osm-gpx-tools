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

// load all img files
const imgFiles = fs.readdirSync(folder)
  .filter(file => file.match(/\.jpg$/i));

let deleteCount = 0;

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
  const direction = imgExifDirection && imgExifDirectionRef ? piexif.GPSHelper.dmsRationalToDeg(imgExifDirection, imgExifDirectionRef) : undefined;
  const latitude  = imgExifLatitude  && imgExifLatitudeRef  ? piexif.GPSHelper.dmsRationalToDeg(imgExifLatitude, imgExifLatitudeRef) : undefined;
  const longitude = imgExifLongitude && imgExifLongitudeRef ? piexif.GPSHelper.dmsRationalToDeg(imgExifLongitude, imgExifLongitudeRef) : undefined;
  const hours = imgExifTimestamp ? piexif.GPSHelper.dmsRationalToDeg(imgExifTimestamp) : undefined;
  const timestamp = imgExifDatestamp ? moment.utc(imgExifDatestamp, 'YYYY:MM:DD').add(hours, 'hours') : undefined;

  // exit if mandatory attributes are missing
  if (timestamp === undefined || latitude === undefined || longitude === undefined) {
    ++deleteCount;
    console.log(`- deleting ${imgPath}`);
    fs.unlinkSync(imgPath);
  }
})

console.log(``);
console.log(`> deleted ${deleteCount}, and kept ${imgFiles.length - deleteCount} original images`)
