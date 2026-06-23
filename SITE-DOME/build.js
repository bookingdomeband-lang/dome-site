const fs = require('fs');
const path = require('path');

const concertsDir = path.join(__dirname, 'concerts');
const output = {};

if (fs.existsSync(concertsDir)) {
  const concerts = fs.readdirSync(concertsDir);
  concerts.forEach(concert => {
    const concertPath = path.join(concertsDir, concert);
    if (fs.statSync(concertPath).isDirectory()) {
      const photos = fs.readdirSync(concertPath)
        .filter(f => /\.(jpg|jpeg|png|webp|gif)$/i.test(f));
      output[concert] = photos;
    }
  });
}

fs.writeFileSync(
  path.join(__dirname, 'concerts.json'),
  JSON.stringify(output, null, 2)
);

console.log('concerts.json généré :', output);
