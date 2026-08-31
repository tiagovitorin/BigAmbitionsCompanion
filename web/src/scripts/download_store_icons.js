const https = require('https');
const fs = require('fs');
const path = require('path');

const targetDir = path.join(__dirname, '../../public/images/storeicons');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

const html = fs.readFileSync('C:/Users/tiago/.gemini/antigravity-cli/brain/3189093f-6f1a-4155-a96a-698173975fab/.system_generated/steps/1975/content.md', 'utf8');

// Match <img src="baimages/storeicon/businesstype_xxx.png" ... ><h2>Store Name</h2>
const regex = /<img[^>]+src=['"]baimages\/storeicon\/([^'"]+\.png)['"][^>]*>\s*><h2>([^<]+)<\/h2>/gi;
const imageMap = {};
const downloadList = [];

let match;
while ((match = regex.exec(html)) !== null) {
  const filename = match[1];
  const businessName = match[2].trim();
  
  imageMap[businessName] = `/images/storeicons/${filename}`;
  downloadList.push({
    url: 'https://www.biggerambitions.com/baimages/storeicon/' + filename,
    dest: path.join(targetDir, filename)
  });
}

console.log('Total business icons parsed:', Object.keys(imageMap).length);

function download(url, dest) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      if (res.statusCode === 200) {
        const fileStream = fs.createWriteStream(dest);
        res.pipe(fileStream);
        fileStream.on('finish', () => {
          fileStream.close();
          resolve(true);
        });
      } else {
        resolve(false);
      }
    }).on('error', () => resolve(false));
  });
}

async function start() {
  let count = 0;
  for (const item of downloadList) {
    if (!fs.existsSync(item.dest)) {
      const ok = await download(item.url, item.dest);
      if (ok) count++;
    } else {
      count++;
    }
  }
  console.log(`Successfully saved ${count} store icons to public/images/storeicons/`);
  fs.writeFileSync(path.join(__dirname, '../data/business_icons.json'), JSON.stringify(imageMap, null, 2));
}

start();
