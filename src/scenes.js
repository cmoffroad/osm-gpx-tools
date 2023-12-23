const fs = require('fs');
const path = require('path');

// GOPRO MOVIE FILE REGEXP
const GOPRO_REGEXP = /\.MP4$/;
const SCENE_REGEXP = /\.jpg$/;

// lookup folder parameter if available otherwuse use current folder
const args = process.argv.slice(2);
const folder = args[0] || path.resolve('.');

if (!fs.existsSync(folder)) {
  console.error(`folder ${folder} does not exist!`);
  process.exit(1);
}

const videos = fs.readdirSync(folder).filter(file => file.match(GOPRO_REGEXP));

// iterate through each file in folder
videos.forEach(video => {

  // compute absolute file path with folder
  const videoPath = path.join(folder, video);
  const scenesFolder = path.join(folder, video.replace(GOPRO_REGEXP, ''));

  // extract original video creation date in ms
  const { mtimeMs } = fs.statSync(videoPath);

  const scenes = fs.readdirSync(scenesFolder).filter(file => file.match(SCENE_REGEXP));

  scenes.forEach(scene => {
    const scenePath = path.join(scenesFolder, scene);
    const sceneTime = parseInt(scene) - 1;
    const newTime = (mtimeMs / 1000.0) + sceneTime;

    // write new time to snapshot file
    fs.utimesSync(scenePath, +new Date(), newTime);

    console.log(scenePath, mtimeMs, newTime);
  });

})