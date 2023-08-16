const fs = require('fs');
const path = require('path');
const piexif = require('piexifjs');
const moment = require('moment');

function degToRad(n) {
  return n * (Math.PI / 180);
}
function radToDeg(n) {
  return n * (180 / Math.PI);
}

function getBearingDeg(lat1, lon1, lat2, lon2) {
  const y = Math.sin(lon2-lon1) * Math.cos(lat2);
  const x = Math.cos(lat1)*Math.sin(lat2) -
            Math.sin(lat1)*Math.cos(lat2)*Math.cos(lon2-lon1);
  const θ = Math.atan2(y, x);
  const b = (θ*180/Math.PI + 360) % 360;
  return b;
}

function pruneFolderImages(folderPath) {
  const imgFiles = fs.readdirSync(folderPath)
    .filter(file => file.match(/\.jpg$/i));

  // iterate through each image file
  imgFiles.forEach(imgFile => {

    // compute absolute image path
    const imgPath = path.join(folderPath, imgFile);

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

  const subFolders = fs.readdirSync(folderPath)
    .filter(file => fs.isDirectory(file));

  subFolder.forEach(subFolder => {
    const subFolderPath = path.join(folderPath, subFolder);
    pruneFolderImages(subFolderPath);
  })
}

module.exports = {
  getBearingDeg,
  pruneFolderImages
}