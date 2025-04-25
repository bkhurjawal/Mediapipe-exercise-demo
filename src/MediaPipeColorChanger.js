import React, { useRef, useEffect, useState } from 'react';

const MediaPipeColorChanger = () => {
  const canvasRef = useRef(null);
  const [image, setImage] = useState(null);
  const [color, setColor] = useState('#FF0000'); // Default color (red)

  // Function to load and process image
  const processImage = (imageFile) => {
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');

      // Draw the original image
      ctx.drawImage(img, 0, 0);

      // Get image data to process
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Convert hex color to RGB
      const hexToRgb = (hex) => {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return [r, g, b];
      };

      const [targetR, targetG, targetB] = hexToRgb(color);

      // Process each pixel - find white MediaPipe lines and change their color
      for (let i = 0; i < data.length; i += 4) {
        // Check if it's a white pixel (MediaPipe lines are white)
        // Adjust these threshold values as needed for your specific images
        if (data[i] > 240 && data[i + 1] > 240 && data[i + 2] > 240) {
          // Replace with selected color
          data[i] = targetR; // Red
          data[i + 1] = targetG; // Green
          data[i + 2] = targetB; // Blue
          // Alpha remains unchanged (data[i+3])
        }
      }

      // Put the processed image data back on the canvas
      ctx.putImageData(imageData, 0, 0);
    };

    // Load image from file
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target.result;
      setImage(e.target.result);
    };
    reader.readAsDataURL(imageFile);
  };

  return (
    <div>
      <h2>MediaPipe Color Changer</h2>

      <div>
        <label htmlFor="imageUpload">Upload Screenshot: </label>
        <input
          type="file"
          id="imageUpload"
          accept="image/*"
          onChange={(e) => processImage(e.target.files[0])}
        />
      </div>

      <div>
        <label htmlFor="colorPicker">Select New Color: </label>
        <input
          type="color"
          id="colorPicker"
          value={color}
          onChange={(e) => {
            setColor(e.target.value);
            if (image) {
              const img = new Image();
              img.onload = () =>
                processImage(dataURLtoFile(image, 'image.png'));
              img.src = image;
            }
          }}
        />
      </div>

      <div style={{ marginTop: '20px' }}>
        <canvas ref={canvasRef} style={{ maxWidth: '100%' }} />
      </div>
    </div>
  );
};

// Helper function to convert dataURL to File
const dataURLtoFile = (dataurl, filename) => {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};

export default MediaPipeColorChanger;
