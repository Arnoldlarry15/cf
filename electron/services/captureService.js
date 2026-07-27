const { desktopCapturer, screen } = require('electron');

class CaptureService {
  async capturePrimaryDisplay() {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: fullWidth, height: fullHeight } = primaryDisplay.bounds;
    const scaleFactor = primaryDisplay.scaleFactor || 1;

    const targetWidth = Math.round(fullWidth * scaleFactor);
    const targetHeight = Math.round(fullHeight * scaleFactor);

    const sources = await desktopCapturer.getSources({ 
      types: ['screen'], 
      thumbnailSize: { width: targetWidth, height: targetHeight } 
    });
    
    if (!sources || sources.length === 0) {
      throw new Error("No screen capture sources found.");
    }

    const primarySource = sources.find(s => s.display_id === String(primaryDisplay.id)) || sources[0];
    return primarySource.thumbnail.toDataURL();
  }
}

module.exports = { CaptureService };

