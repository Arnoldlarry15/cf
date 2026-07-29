let isDragging = false;
let startX, startY;
let scrollAnimationFrame = null;
let lastMouseEvent = null;

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

function updateSelectionBox() {
  if (!isDragging || !lastMouseEvent) return;

  const edgeThreshold = 50; // px from screen top/bottom
  const scrollSpeed = 15;
  const clientY = lastMouseEvent.clientY;
  const clientX = lastMouseEvent.clientX;

  // Edge auto-scrolling loop
  if (clientY > window.innerHeight - edgeThreshold) {
    window.scrollBy({ top: scrollSpeed, behavior: 'auto' });
  } else if (clientY < edgeThreshold) {
    window.scrollBy({ top: -scrollSpeed, behavior: 'auto' });
  }

  const pageX = clientX + window.scrollX;
  const pageY = clientY + window.scrollY;

  const currentStartX = startX;
  const currentStartY = startY;

  const width = Math.abs(pageX - currentStartX);
  const height = Math.abs(pageY - currentStartY);

  const left = Math.min(pageX, currentStartX);
  const top = Math.min(pageY, currentStartY);

  selection.style.width = width + 'px';
  selection.style.height = height + 'px';
  selection.style.left = left + 'px';
  selection.style.top = top + 'px';

  if (isDragging) {
    scrollAnimationFrame = requestAnimationFrame(updateSelectionBox);
  }
}

document.addEventListener('mousedown', (e) => {
  e.preventDefault();
  isDragging = true;
  startX = e.clientX + window.scrollX;
  startY = e.clientY + window.scrollY;
  lastMouseEvent = e;
  
  selection.style.left = startX + 'px';
  selection.style.top = startY + 'px';
  selection.style.width = '0px';
  selection.style.height = '0px';
  selection.style.display = 'block';
  
  // Remove full body dim, let the selection box shadow handle dimming everything outside it
  document.body.style.boxShadow = 'none';

  if (scrollAnimationFrame) cancelAnimationFrame(scrollAnimationFrame);
  scrollAnimationFrame = requestAnimationFrame(updateSelectionBox);
});

document.addEventListener('mousemove', (e) => {
  if (!isDragging) return;
  lastMouseEvent = e;
});

document.addEventListener('mouseup', (e) => {
  if (!isDragging) return;
  isDragging = false;
  if (scrollAnimationFrame) {
    cancelAnimationFrame(scrollAnimationFrame);
    scrollAnimationFrame = null;
  }
  
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
    if (scrollAnimationFrame) {
      cancelAnimationFrame(scrollAnimationFrame);
      scrollAnimationFrame = null;
    }
    const currentApi = getAPI();
    if (currentApi && currentApi.closeSnipper) {
      currentApi.closeSnipper();
    }
  }
});


