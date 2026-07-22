const { desktopCapturer, screen } = require('electron');

class CaptureService {
  async capturePrimaryDisplay() {
    const primaryDisplay = screen.getPrimaryDisplay();
    const { width: fullWidth, height: fullHeight } = primaryDisplay.bounds;

    const sources = await desktopCapturer.getSources({ 
      types: ['screen'], 
      thumbnailSize: { width: fullWidth, height: fullHeight } 
    });
    
    const primarySource = sources[0];
    return primarySource.thumbnail.toDataURL();
  }
}

module.exports = { CaptureService };
