let isDragging = false;
let startX, startY;
const selection = document.getElementById('selection');
const bg = document.getElementById('desktop-bg');

window.electronAPI.onStartSnipping((dataUrl) => {
  bg.src = dataUrl;
  
  // Only dim the screen after the image is loaded and displayed to prevent weird flashing
  bg.onload = () => {
    document.body.style.boxShadow = 'inset 0 0 0 9999px rgba(0,0,0,0.15)'; // dim whole screen initially
  };
});

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
  if (rect.width > 5 && rect.height > 5) {
    // Hide UI elements before cropping
    selection.style.display = 'none';
    
    // Crop the image
    const canvas = document.createElement('canvas');
    canvas.width = rect.width;
    canvas.height = rect.height;
    const ctx = canvas.getContext('2d');
    
    // Draw the portion of the image onto the canvas
    ctx.drawImage(bg, 
      rect.left, rect.top, rect.width, rect.height, 
      0, 0, rect.width, rect.height
    );
    
    const dataUrl = canvas.toDataURL('image/png');
    window.electronAPI.processSnippet({ dataUrl, rect: { x: rect.left, y: rect.top, w: rect.width, h: rect.height } });
  } else {
    // If just clicked, close it
    window.electronAPI.closeSnipper();
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    window.electronAPI.closeSnipper();
  }
});
