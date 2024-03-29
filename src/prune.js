const fs = require('fs');
const path = require('path');
const lib = require('./lib')

// lookup folder parameter if available otherwuse use current folder
const args = process.argv.slice(2);
const folder = path.resolve(args[0], '.');

if (!fs.existsSync(folder)) {
  console.error(`folder ${folder} does not exist!`);
  process.exit(1);
}

lib.pruneFolderImages(folder);

