import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';

const drawOptions = { visibilityMin: 0.45 };
const landmarksToRemove = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 16, 17, 18, 19, 20, 21, 22, 27, 28, 29,
  30, 31, 32,
];

export const drawStylizedBone = (
  ctx,
  x1,
  y1,
  x2,
  y2,
  topWidth = 24,
  midWidth = 16,
  triangleLength = 20,
  color
) => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const angle = Math.atan2(dy, dx);

  const nx = Math.cos(angle + Math.PI / 2);
  const ny = Math.sin(angle + Math.PI / 2);

  const tipX = x2 + (dx / Math.hypot(dx, dy)) * triangleLength;
  const tipY = y2 + (dy / Math.hypot(dx, dy)) * triangleLength;

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
};

export function drawSpineLikeReference(ctx, landmarks, color) {
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

  ctx.save();

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

  ctx.lineWidth = 0.5;
  ctx.setLineDash([]);

  ctx.restore();
}

export function drawShoulders(ctx, landmarks, transform, color) {
  const right = landmarks[11];
  const left = landmarks[12];

  if (
    !right ||
    !left ||
    (right.visibility ?? 0) < 0.75 ||
    (left.visibility ?? 0) < 0.75
  )
    return;

  const p1 = transform(right);
  const p2 = transform(left);

  const midX = (p1.x + p2.x) / 2;
  const midY = (p1.y + p2.y) / 2;

  ctx.save();

  ctx.beginPath();
  ctx.moveTo(midX, midY);
  ctx.quadraticCurveTo(midX + (p1.x - midX) * 0.3, midY + 10, p1.x, p1.y);
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(midX, midY);
  ctx.quadraticCurveTo(midX + (p2.x - midX) * 0.3, midY + 10, p2.x, p2.y);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(midX, midY, 5, 0, 2 * Math.PI);
  ctx.fillStyle = color;
  ctx.fill();

  ctx.restore();
}

export function drawHip(ctx, landmarks, transform, color) {
  const left = landmarks[23];
  const right = landmarks[24];
  if (
    !left ||
    !right ||
    (left.visibility ?? 0) < 0.75 ||
    (right.visibility ?? 0) < 0.75
  )
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

  // Rounded end circles at p1 and p2
  // ctx.beginPath();
  // ctx.arc(p1.x, p1.y, hipRadius / 2.5, 0, 2 * Math.PI);
  // ctx.fill();

  // ctx.beginPath();
  // ctx.arc(p2.x, p2.y, hipRadius / 2.5, 0, 2 * Math.PI);
  // ctx.fill();

  ctx.restore();
}

export function drawSpineLines(
  ctx,
  landmarks,
  transform,
  color,
  lineWidth = 2,
  visibilityMin = 0.75
) {
  const ls = landmarks[11];
  const rs = landmarks[12];
  const lh = landmarks[23];
  const rh = landmarks[24];

  if (
    !ls ||
    !rs ||
    !lh ||
    !rh ||
    ls.visibility < visibilityMin ||
    rs.visibility < visibilityMin ||
    lh.visibility < visibilityMin ||
    rh.visibility < visibilityMin
  ) {
    return;
  }

  const shoulderMid = {
    x: (transform(ls).x + transform(rs).x) / 2,
    y: (transform(ls).y + transform(rs).y) / 2,
  };

  const hipMid = {
    x: (transform(lh).x + transform(rh).x) / 2,
    y: (transform(lh).y + transform(rh).y) / 2,
  };

  ctx.beginPath();
  ctx.moveTo(shoulderMid.x, shoulderMid.y);
  ctx.lineTo(hipMid.x, hipMid.y);
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

const PoseTrackerWithWebcam = () => {
  const [poseLandmarker, setPoseLandmarker] = useState(null);
  const [skeletonUi, setSkeletonUi] = useState(true);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animationFrameId = useRef(null);

  useEffect(() => {
    const loadPoseLandmarker = async () => {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm'
      );

      const landmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/latest/pose_landmarker_heavy.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numPoses: 1,
        minPoseDetectionConfidence: 0.6,
        minTrackingConfidence: 0.6,
      });

      setPoseLandmarker(landmarker);
    };

    const startWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          video.onloadedmetadata = () => {
            video.play();
            const canvas = canvasRef.current;
            if (canvas) {
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
            }
          };
        }
      } catch (e) {
        console.error('Webcam access failed:', e);
      }
    };

    loadPoseLandmarker();
    startWebcam();
  }, []);

  const getScaleOffset = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return { scaleX: 1, scaleY: 1 };

    const rect = canvas.getBoundingClientRect();
    return {
      scaleX: rect.width / video.videoWidth,
      scaleY: rect.height / video.videoHeight,
    };
  };

  const drawCallback = useCallback(
    (results) => {
      if (!results.landmarks[0] || !canvasRef.current || !videoRef.current)
        return;

      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      const video = videoRef.current;
      const landmarks = results.landmarks[0];

      const canvasWidth = (canvas.width = video.videoWidth);
      const canvasHeight = (canvas.height = video.videoHeight);

      const transform = (landmark) => ({
        x: landmark.x * canvas.width,
        y: landmark.y * canvas.height,
      });

      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      const lineWidth = 5;

      const boneColor = 'white';

      const thighBones = [
        { points: [11, 13], style: { top: 20, bottom: 8, color: boneColor } },
        { points: [13, 15], style: { top: 20, bottom: 8, color: boneColor } },
        { points: [12, 14], style: { top: 20, bottom: 8, color: boneColor } },
        { points: [14, 16], style: { top: 20, bottom: 8, color: boneColor } },
        { points: [23, 25], style: { top: 20, bottom: 8, color: boneColor } },
        { points: [25, 27], style: { top: 20, bottom: 8, color: boneColor } },
        { points: [24, 26], style: { top: 20, bottom: 8, color: boneColor } },
        { points: [26, 28], style: { top: 20, bottom: 8, color: boneColor } },
      ];
      if (!skeletonUi) {
        thighBones.push(
          { points: [11, 12], style: { top: 20, bottom: 8, color: boneColor } },
          { points: [23, 24], style: { top: 20, bottom: 8, color: boneColor } },
          { points: [11, 23], style: { top: 20, bottom: 8, color: boneColor } },
          { points: [12, 24], style: { top: 20, bottom: 8, color: boneColor } }
        );
      }

      thighBones.forEach(({ points: [startIdx, endIdx], style }) => {
        const start = landmarks[startIdx];
        const end = landmarks[endIdx];
        if (
          start.visibility < drawOptions.visibilityMin ||
          end.visibility < drawOptions.visibilityMin
        )
          return;

        const p1 = transform(start);
        const p2 = transform(end);

        if (skeletonUi) {
          drawShoulders(ctx, landmarks, transform, boneColor);
          drawHip(ctx, landmarks, transform, boneColor);
          drawStylizedBone(ctx, p1.x, p1.y, p2.x, p2.y, 20, 2, 2, boneColor);
          drawSpineLikeReference(ctx, landmarks, boneColor);
        } else {
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = boneColor;
          ctx.lineWidth = lineWidth;
          ctx.stroke();
        }
      });

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
    },
    [skeletonUi]
  );
  const runPoseDetection = useCallback(() => {
    const detect = async () => {
      const video = videoRef.current;
      if (!video || !poseLandmarker) return;

      if (video.videoWidth === 0 || video.videoHeight === 0) {
        requestAnimationFrame(detect);
        return;
      }

      const startTimeMs = performance.now();
      try {
        await poseLandmarker.detectForVideo(video, startTimeMs, drawCallback);
      } catch (e) {
        console.error('Pose detection error:', e);
        return;
      }

      animationFrameId.current = requestAnimationFrame(detect);
    };

    detect();
  }, [poseLandmarker, drawCallback]);

  useEffect(() => {
    if (poseLandmarker) runPoseDetection();
    return () => {
      if (animationFrameId.current)
        cancelAnimationFrame(animationFrameId.current);
    };
  }, [poseLandmarker, runPoseDetection]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
        height: '100vh',
        padding: '2rem',
      }}
    >
      <div style={{ position: 'relative', width: '1280px', height: '720px' }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          onLoadedMetadata={() => {
            if (canvasRef.current && videoRef.current) {
              canvasRef.current.width = videoRef.current.videoWidth;
              canvasRef.current.height = videoRef.current.videoHeight;
            }
          }}
          style={{
            position: 'absolute',
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
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 2,
            objectFit: 'contain',
          }}
        />
      </div>

      <button
        onClick={() => setSkeletonUi((prev) => !prev)}
        style={{
          marginTop: '1rem',
          backgroundColor: 'red',
          color: 'white',
          padding: '20px',
          border: 'none',
          borderRadius: '4px',
          fontSize: '26px',
          cursor: 'pointer',
          transition: 'background-color 0.3s',
        }}
      >
        Toggle Skeleton
      </button>
    </div>
  );
};

export default PoseTrackerWithWebcam;
