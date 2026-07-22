const fs = require('fs');
const { app, nativeImage } = require('electron');
app.whenReady().then(() => {
  const img = nativeImage.createFromPath('icon.jpg');
  fs.writeFileSync('icon.png', img.toPNG());
  app.quit();
});
