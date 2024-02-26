const fs = require('fs');
const path = require('path');

// GOPRO MOVIE FILE REGEXP
const GOPRO_REGEXP = /\.MP4$/;

// lookup folder parameter if available otherwuse use current folder
const args = process.argv.slice(2);
const videosFolder = args[0] || path.resolve('.');

if (!fs.existsSync(videosFolder)) {
  console.error(`videos folder ${videosFolder} does not exist!`);
  process.exit(1);
}

const videos = fs.readdirSync(videosFolder).filter(file => file.match(GOPRO_REGEXP));

// iterate through each file in folder
videos.forEach(video => {

  // compute absolute file path with folder
  const videoPath = path.join(videosFolder, video);
  const scenesFolder = path.join(videosFolder, video.replace(/\.[^/.]+$/, ""));

  // extract original video creation date in ms
  const { mtimeMs } = fs.statSync(videoPath);
  const videoTime = mtimeMs / 1000.0;
  const videoDate = new Date(mtimeMs);

  const scenes = fs.readdirSync(scenesFolder);

  console.log(`-- processing ${videoPath} [${videoDate.toUTCString()}] (${scenes.length} scenes)`);

  scenes.forEach(scene => {
    const scenePath = path.join(scenesFolder, scene);
    const sceneMatch = scene.match(/_(\d+).jpg$/);
    if (sceneMatch) {
      const sceneIndex = sceneMatch[1];
      const sceneTime = parseInt(sceneIndex) - 1;
      const newTime = videoTime + sceneTime;
      const newDate = new Date(newTime * 1000);

      // write new time to snapshot file
      fs.utimesSync(scenePath, +new Date(), newTime);

      console.log(`    ${scene} [${newDate.toUTCString()}] +${sceneTime}`)
    }
  });

})