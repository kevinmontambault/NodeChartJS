const os = require('os');
const path = require('path');
const fs = require('fs');
const https = require('https');

let platformPath = '';
let fileName = '';
const platform = os.platform();
if(platform === 'win32'){
  platformPath = `/windows/${os.arch()}`;
  fileName = 'scapp.exe';
}else if(platform === 'linux'){
  platformPath = `/linux/${os.arch()}`;
  fileName = 'scapp';
}else if(platform === 'darwin'){
  platformPath = `/macosx`;
  fileName = 'scapp';
}else{
  console.error(`Unsupported platform '${platform}'`);
  process.exit(1);
}

const binFolderPath = path.join(__dirname, '../bin');
fs.mkdir(binFolderPath, {recursive:true}, err => {
  if(err){ throw err; }

  const binFilePath = path.join(binFolderPath, 'scapp');
  const file = fs.createWriteStream(binFilePath);
  const url = `https://gitlab.com/sciter-engine/sciter-js-sdk/-/raw/main/bin${platformPath}/${fileName}`;

  https.get(url, response => {
    if(response.statusCode !== 200){ throw new Error(`Failed to download ${url}: ${response.statusCode}`); }
    response.pipe(file);
  
    file.on('finish', () => file.close());
  }).on('error', err => {
    fs.unlink(binFilePath, () => {
      throw err;
    });
  });
});