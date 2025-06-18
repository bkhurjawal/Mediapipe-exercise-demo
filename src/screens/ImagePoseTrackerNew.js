import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';
import React, { useEffect, useRef, useState } from 'react';

const ImagePoseTrackerNew = () => {
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const [poseLandmarker, setPoseLandmarker] = useState(null);

  // Hardcoded image path (must be in public folder)
  const imageUrl = '/squat_white.jpg';

  useEffect(() => {
    const initLandmarker = async () => {
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
      });
      setPoseLandmarker(landmarker);
    };
    initLandmarker();
  }, []);

  const processImage = () => {
    const canvas = canvasRef.current;
    const image = imageRef.current;
    const ctx = canvas.getContext('2d');

    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0);

    if (!poseLandmarker) return;

    const results = poseLandmarker.detect(image);
    if (results.landmarks.length) {
      const landmarks = results.landmarks[0];
      drawBones(ctx, landmarks);
      drawSpine(ctx, landmarks);
    }
  };

  const drawBones = (ctx, landmarks) => {
    const connections = [
      [11, 13],
      [13, 15], // Left arm
      [12, 14],
      [14, 16], // Right arm
      [23, 25],
      [25, 27], // Left leg
      [24, 26],
      [26, 28], // Right leg
      [11, 12],
      [23, 24], // Shoulders and hips
      [11, 23],
      [12, 24], // Left spine, Right spine
    ];

    const { width: W, height: H } = ctx.canvas;

    ctx.save();
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.8)';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';

    connections.forEach(([startIdx, endIdx]) => {
      const start = landmarks[startIdx];
      const end = landmarks[endIdx];
      if (start.visibility > 0.5 && end.visibility > 0.5) {
        ctx.beginPath();
        ctx.moveTo(start.x * W, start.y * H);
        ctx.lineTo(end.x * W, end.y * H);
        ctx.stroke();
      }
    });

    ctx.restore();
  };

  const drawSpine = (ctx, landmarks, color = '#6AC66A') => {
    const ls = landmarks[11];
    const rs = landmarks[12];
    const lh = landmarks[23];
    const rh = landmarks[24];

    if ([ls, rs, lh, rh].some((l) => l.visibility < 0.75)) return;

    const { width: W, height: H } = ctx.canvas;
    const topX = ((ls.x + rs.x) / 2) * W;
    const topY = ((ls.y + rs.y) / 2) * H;
    const bottomX = ((lh.x + rh.x) / 2) * W;
    const bottomY = ((lh.y + rh.y) / 2) * H;

    const dx = bottomX - topX;
    const dy = bottomY - topY;
    const spineLength = Math.hypot(dx, dy);
    const ux = dx / spineLength;
    const uy = dy / spineLength;

    const dashCount = 8;
    const dashLength = spineLength * 0.02;
    const spacing = spineLength / (dashCount + 1);

    ctx.save();
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
  };

  return (
    <div>
      <img
        ref={imageRef}
        src={imageUrl}
        alt="Pose Input"
        onLoad={processImage}
        style={{ display: 'none' }}
      />
      <canvas ref={canvasRef} style={{ maxWidth: '100%' }} />
    </div>
  );
};

export default ImagePoseTrackerNew;
