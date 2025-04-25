import React, { useEffect, useRef } from 'react';

const PoseKeypointOverlay = ({
  imageDataURL,
  landmarks,
  highlightPoints = [13, 15],
  canvasStyle = { width: '100%', maxWidth: 720, border: '1px solid #ccc' },
}) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageDataURL || !landmarks?.length) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);

      // Draw each landmark
      landmarks.forEach((lm, idx) => {
        if (lm.visibility !== undefined && lm.visibility < 0.65) return;

        const x = lm.x * img.width;
        const y = lm.y * img.height;

        ctx.beginPath();
        ctx.arc(x, y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = highlightPoints.includes(idx) ? 'orange' : 'white';
        ctx.fill();
      });
    };
    img.src = imageDataURL;
  }, [imageDataURL, landmarks, highlightPoints]);

  return <canvas ref={canvasRef} style={canvasStyle} />;
};

export default PoseKeypointOverlay;
