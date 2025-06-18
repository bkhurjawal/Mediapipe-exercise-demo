import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';
import { Button } from 'primereact/button';
import React, { useEffect, useRef, useState } from 'react';

const landmarksToRemove = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 16, 17, 18, 19, 20, 21, 22, 27, 28, 29,
  30, 31, 32,
];
const drawOptions = { color: 'white', lineWidth: 5, visibilityMin: 0.25 };
const defaultImageSize = { width: 1280, height: 720 };

const ImagePoseTracker = () => {
  const [poseLandmarker, setPoseLandmarker] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const imageRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // Load Mediapipe Pose Detector
  useEffect(() => {
    const loadPoseLandmarker = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm'
        );
        const landmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/latest/pose_landmarker_heavy.task',
            delegate: 'GPU',
          },
          runningMode: 'IMAGE',
          numPoses: 1,
          minPoseDetectionConfidence: 0.6,
          minTrackingConfidence: 0.6,
        });

        setPoseLandmarker(landmarker);
        console.log('PoseLandmarker loaded successfully');
      } catch (error) {
        console.error('Error loading PoseLandmarker:', error);
      }
    };

    loadPoseLandmarker();
  }, []);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setImageUrl(e.target.result);
      setIsReady(false); // Reset for new image
    };
    reader.readAsDataURL(file);
  };

  // Handle image loading and setup canvas
  useEffect(() => {
    if (!imageUrl) return;

    const image = imageRef.current;
    if (!image) return;

    const handleImageLoaded = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Set canvas dimensions to match image
      canvas.width = image.width;
      canvas.height = image.height;

      // Clear previous drawing
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      setIsReady(true);
    };

    // Add load event once
    image.addEventListener('load', handleImageLoaded);

    return () => {
      image.removeEventListener('load', handleImageLoaded);
    };
  }, [imageUrl]);

  const detectPose = async () => {
    if (!poseLandmarker || !imageRef.current || !isReady) return;

    setIsProcessing(true);

    try {
      const image = imageRef.current;
      const results = await poseLandmarker.detect(image);

      if (results.landmarks.length > 0) {
        drawResults(results);
      } else {
        console.log('No pose detected');
      }
    } catch (error) {
      console.error('Error detecting pose:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  function drawStylizedBone(
    ctx,
    x1,
    y1,
    x2,
    y2,
    topWidth = 24,
    midWidth = 16,
    triangleLength = 20,
    color = '#FFFFFF'
  ) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const angle = Math.atan2(dy, dx);

    const nx = Math.cos(angle + Math.PI / 2);
    const ny = Math.sin(angle + Math.PI / 2);

    // Triangle tip
    const tipX = x2 + (dx / Math.hypot(dx, dy)) * triangleLength;
    const tipY = y2 + (dy / Math.hypot(dx, dy)) * triangleLength;

    // Function to compute points with a multiplier
    const getPoints = (scale = 1) => {
      return {
        x1Left: x1 + (nx * topWidth * scale) / 2,
        y1Left: y1 + (ny * topWidth * scale) / 2,
        x1Right: x1 - (nx * topWidth * scale) / 2,
        y1Right: y1 - (ny * topWidth * scale) / 2,
        x2Left: x2 + (nx * midWidth * scale) / 2,
        y2Left: y2 + (ny * midWidth * scale) / 2,
        x2Right: x2 - (nx * midWidth * scale) / 2,
        y2Right: y2 - (ny * midWidth * scale) / 2,
      };
    };

    // Draw colored bone
    const shape = getPoints(0.65);
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(shape.x1Left, shape.y1Left);
    ctx.lineTo(shape.x2Left, shape.y2Left);
    ctx.lineTo(tipX, tipY);
    ctx.lineTo(shape.x2Right, shape.y2Right);
    ctx.lineTo(shape.x1Right, shape.y1Right);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
  }

  function drawSpineLikeReference(ctx, landmarks, color = '#FFFFFF') {
    const ls = landmarks[11]; // Left shoulder
    const rs = landmarks[12]; // Right shoulder
    const lh = landmarks[23]; // Left hip
    const rh = landmarks[24]; // Right hip

    if ([ls, rs, lh, rh].some((l) => l.visibility < 0.75)) return;

    const { width: W, height: H } = ctx.canvas;

    // Midpoint between shoulders and hips
    const topX = ((ls.x + rs.x) / 2) * W;
    const topY = ((ls.y + rs.y) / 2) * H;
    const bottomX = ((lh.x + rh.x) / 2) * W;
    const bottomY = ((lh.y + rh.y) / 2) * H;

    const dx = bottomX - topX;
    const dy = bottomY - topY;
    const spineLength = Math.hypot(dx, dy);

    const ux = dx / spineLength;
    const uy = dy / spineLength;

    // Perpendicular direction (normalized)
    const nx = -uy;
    const ny = ux;

    ctx.save();

    // Dashed spine
    const dashCount = 8;
    const dashLength = spineLength * 0.02;
    const spacing = spineLength / (dashCount + 1);

    ctx.strokeStyle = color;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';

    for (let i = 0; i < dashCount; i++) {
      const offset = spacing * (i + 1);

      const cx = topX + ux * offset;
      const cy = topY + uy * offset;

      const x1 = cx - ux * (dashLength / 2);
      const y1 = cy - uy * (dashLength / 2);
      const x2 = cx + ux * (dashLength / 2);
      const y2 = cy + uy * (dashLength / 2);

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawShoulder(ctx, landmarks, transform, color = '#FFFFFF') {
    const right = landmarks[11];
    const left = landmarks[12];

    if (!right || !left || right.visibility < 0.75 || left.visibility < 0.75)
      return;

    const p1 = transform(right); // Right shoulder
    const p2 = transform(left); // Left shoulder

    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;

    ctx.save();

    // Curve downward to right shoulder
    ctx.beginPath();
    ctx.moveTo(midX, midY);
    ctx.quadraticCurveTo(
      midX + (p1.x - midX) * 0.3, // slight outward curve
      midY + 10, // lower Y for downward dip
      p1.x,
      p1.y
    );
    ctx.strokeStyle = color;
    ctx.lineWidth = 8;
    ctx.stroke();

    // Curve downward to left shoulder
    ctx.beginPath();
    ctx.moveTo(midX, midY);
    ctx.quadraticCurveTo(
      midX + (p2.x - midX) * 0.3,
      midY + 10, // lower Y for downward dip
      p2.x,
      p2.y
    );
    ctx.stroke();

    // Draw center joint circle
    ctx.beginPath();
    ctx.arc(midX, midY, 5, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();

    ctx.restore();
  }

  function drawHip(ctx, landmarks, transform, color = '#FFFFFF') {
    const left = landmarks[23];
    const right = landmarks[24];
    if (!left || !right || left.visibility < 0.75 || right.visibility < 0.75)
      return;

    const p1 = transform(left);
    const p2 = transform(right);

    const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
    const mid = {
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2,
    };

    const hipRadius = 18;
    const curveDepth = 12;

    const nx = Math.cos(angle + Math.PI / 2);
    const ny = Math.sin(angle + Math.PI / 2);

    const p1Outer = { x: p1.x + nx * hipRadius, y: p1.y + ny * hipRadius };
    const p2Outer = { x: p2.x + nx * hipRadius, y: p2.y + ny * hipRadius };

    ctx.save();
    ctx.beginPath();

    ctx.moveTo(p1Outer.x, p1Outer.y);
    ctx.quadraticCurveTo(mid.x, mid.y + curveDepth, p2Outer.x, p2Outer.y);

    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    ctx.restore();
  }

  const drawResults = (results) => {
    if (!results.landmarks[0] || !canvasRef.current || !imageRef.current)
      return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const image = imageRef.current;
    const landmarks = results.landmarks[0];

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Transform function to convert normalized coordinates to canvas coordinates
    const transform = (landmark) => ({
      x: landmark.x * canvas.width,
      y: landmark.y * canvas.height,
    });

    // Define bone color
    const boneColor = 'white';

    // Define bone connections
    const bones = [
      { points: [11, 13], style: { top: 20, bottom: 8, color: boneColor } }, // Left upper arm
      { points: [13, 15], style: { top: 20, bottom: 8, color: boneColor } }, // Left lower arm
      { points: [12, 14], style: { top: 20, bottom: 8, color: boneColor } }, // Right upper arm
      { points: [14, 16], style: { top: 20, bottom: 8, color: boneColor } }, // Right lower arm
      { points: [23, 25], style: { top: 20, bottom: 8, color: boneColor } }, // Left upper leg
      { points: [25, 27], style: { top: 20, bottom: 8, color: boneColor } }, // Left lower leg
      { points: [24, 26], style: { top: 20, bottom: 8, color: boneColor } }, // Right upper leg
      { points: [26, 28], style: { top: 20, bottom: 8, color: boneColor } }, // Right lower leg
    ];

    // Draw bones
    bones.forEach(({ points: [startIdx, endIdx], style }) => {
      const start = landmarks[startIdx];
      const end = landmarks[endIdx];
      if (
        start.visibility < drawOptions.visibilityMin ||
        end.visibility < drawOptions.visibilityMin
      )
        return;

      const p1 = transform(start);
      const p2 = transform(end);

      drawStylizedBone(ctx, p1.x, p1.y, p2.x, p2.y, 20, 2, 2, boneColor);
    });

    // Draw spine
    drawSpineLikeReference(ctx, landmarks, boneColor);

    // Draw shoulders and hips
    drawShoulder(ctx, landmarks, transform, boneColor);
    drawHip(ctx, landmarks, transform, boneColor);

    // Draw landmarks (joints)
    landmarks.forEach((lm, idx) => {
      if (
        landmarksToRemove.includes(idx) ||
        lm.visibility < drawOptions.visibilityMin
      )
        return;

      const { x, y } = transform(lm);
      ctx.beginPath();
      const circleRadius = 5;
      ctx.arc(x, y, circleRadius, 0, 2 * Math.PI);
      ctx.fillStyle = boneColor;
      ctx.fill();
    });
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'black',
        minHeight: '100vh',
        color: 'white',
        padding: '2rem',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginBottom: '1rem',
        }}
      >
        <div
          style={{
            position: 'relative',
            width: '1280px',
            height: '720px',
            backgroundColor: '#1f1f1f',
            borderRadius: '12px',
            overflow: 'hidden',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {imageUrl ? (
            <>
              <img
                ref={imageRef}
                src={imageUrl}
                alt="Uploaded"
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  zIndex: 1,
                }}
              />
              <canvas
                ref={canvasRef}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  pointerEvents: 'none',
                  zIndex: 2,
                }}
              />
            </>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#999',
              }}
            >
              <p>Upload an image to detect poses</p>
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          ref={fileInputRef}
          style={{ display: 'none' }}
        />
        <Button
          label="Upload Image"
          onClick={() => fileInputRef.current.click()}
        />
        <Button
          label="Detect Pose"
          onClick={detectPose}
          disabled={!isReady || isProcessing || !imageUrl}
        />
        {isProcessing && <span>Processing...</span>}
      </div>
    </div>
  );
};

export default ImagePoseTracker;
