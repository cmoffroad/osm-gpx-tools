const fs = require('fs');

// VLC snaphost filename regexp based on prefix "$F-$T-" with sequential numbering enabled
const SNAP_REGEXP = /file___((_[a-zA-Z0-9]+)*).([a-zA-Z0-9]+)-(\d{2})_(\d{2})_(\d{2})-\d+\.jpg/;

// lookup folder parameter if available otherwuse use current folder
const args = process.argv.slice(2);
const folder = args[0] || path.resolve('.');

if (!fs.existsSync(folder)) {
  console.error(`folder ${folder} does not exist!`);
  process.exit(1);
}

// read current directory files
const files = fs.readdirSync(folder);

// iterate through each file in folder
files.forEach(file => {
  // test for snapshot regexp
  const matches = file.match(SNAP_REGEXP);
  if (!matches)
    return;

  // compute orginal video path
  const videoPath = matches[1].replace(/_/g, '/') + '.' + matches[3];
  // compute snap video time in seconds
  const snapTime = (
    (parseInt(matches[4]) * 3600) +
    (parseInt(matches[5]) * 60) +
    (parseInt(matches[6]))
  );

  // extract original video creation date in ms
  const { mtimeMs } = fs.statSync(videoPath);

  // compute new snapshot time in seconds
  const newTime = (mtimeMs / 1000.0) + snapTime;

  // write new time to snapshot file
  fs.utimesSync(file, +new Date(), newTime);

  console.log(videoPath, snapTime);
})