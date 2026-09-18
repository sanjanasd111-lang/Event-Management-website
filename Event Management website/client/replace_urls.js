const fs = require('fs');
const path = require('path');

const directoryPath = 'c:/Users/pabit/Downloads/Event Management website/client/src';

const replaceInFiles = (dir) => {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      replaceInFiles(filePath);
    } else if (filePath.endsWith('.js') || filePath.endsWith('.jsx')) {
      let content = fs.readFileSync(filePath, 'utf8');
      if (content.includes('http://localhost:5001/api')) {
        content = content.replace(/http:\/\/localhost:5001\/api/g, '/api');
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${filePath}`);
      }
    }
  }
};

replaceInFiles(directoryPath);
console.log('Done replacing URLs.');
