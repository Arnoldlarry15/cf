let isDragging = false;
let startX, startY;
const selection = document.getElementById('selection');
const bg = document.getElementById('desktop-bg');

const getAPI = () => window.captureflow || window.electronAPI;

const api = getAPI();
if (api && api.onStartSnipping) {
  api.onStartSnipping((dataUrl) => {
    bg.src = dataUrl;
    
    // Only dim the screen after the image is loaded and displayed to prevent weird flashing
    bg.onload = () => {
      document.body.style.boxShadow = 'inset 0 0 0 9999px rgba(0,0,0,0.15)'; // dim whole screen initially
    };
  });
} else {
  console.error("CaptureFlow API not found on window object.");
}

document.addEventListener('mousedown', (e) => {
  e.preventDefault();
  isDragging = true;
  startX = e.clientX;
  startY = e.clientY;
  
  selection.style.left = startX + 'px';
  selection.style.top = startY + 'px';
  selection.style.width = '0px';
  selection.style.height = '0px';
  selection.style.display = 'block';
  
  // Remove full body dim, let the selection box shadow handle dimming everything outside it
  document.body.style.boxShadow = 'none';
});

document.addEventListener('mousemove', (e) => {
  if (!isDragging) return;
  
  const currentX = e.clientX;
  const currentY = e.clientY;
  
  const width = Math.abs(currentX - startX);
  const height = Math.abs(currentY - startY);
  
  selection.style.width = width + 'px';
  selection.style.height = height + 'px';
  selection.style.left = (currentX < startX ? currentX : startX) + 'px';
  selection.style.top = (currentY < startY ? currentY : startY) + 'px';
});

document.addEventListener('mouseup', (e) => {
  if (!isDragging) return;
  isDragging = false;
  
  const rect = selection.getBoundingClientRect();
  const currentApi = getAPI();

  if (rect.width > 5 && rect.height > 5) {
    // Hide UI elements before cropping
    selection.style.display = 'none';
    
    // Calculate high DPI scale factors between captured image natural size and CSS viewport size
    const scaleX = (bg.naturalWidth && bg.clientWidth) ? (bg.naturalWidth / bg.clientWidth) : 1;
    const scaleY = (bg.naturalHeight && bg.clientHeight) ? (bg.naturalHeight / bg.clientHeight) : 1;

    // Crop the image
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(rect.width * scaleX);
    canvas.height = Math.round(rect.height * scaleY);
    const ctx = canvas.getContext('2d');
    
    // Draw the portion of the image onto the canvas
    ctx.drawImage(bg, 
      rect.left * scaleX, rect.top * scaleY, rect.width * scaleX, rect.height * scaleY, 
      0, 0, canvas.width, canvas.height
    );
    
    const dataUrl = canvas.toDataURL('image/png');
    if (currentApi && currentApi.processSnippet) {
      currentApi.processSnippet({ dataUrl, rect: { x: rect.left, y: rect.top, w: rect.width, h: rect.height } });
    } else if (currentApi && currentApi.closeSnipper) {
      currentApi.closeSnipper();
    }
  } else {
    // If just clicked, close it
    if (currentApi && currentApi.closeSnipper) {
      currentApi.closeSnipper();
    }
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const currentApi = getAPI();
    if (currentApi && currentApi.closeSnipper) {
      currentApi.closeSnipper();
    }
  }
});

