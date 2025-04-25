import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';
import { Button } from 'primereact/button';
import React, { useEffect, useRef, useState } from 'react';

const landmarksToRemove = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 16, 17, 18, 19, 20, 21, 22, 27, 28, 29,
  30, 31, 32,
];
// const landmarksToRemove = [0,1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const drawOptions = { color: 'white', lineWidth: 5, visibilityMin: 0.65 };
const defaultVideoSize = { width: 1280, height: 720 };

const jump = '/video/jump.mp4';
const weight = '/video/weight.mp4';
const yog = '/video/yog.mp4';
const split = '/video/split.mp4';
const dance = '/video/dance.mp4';
const PoseTrackerWithUpload = () => {
  const [poseLandmarker, setPoseLandmarker] = useState(null);

  const [videoSrc, setVideoSrc] = useState(split);
  const [videoReady, setVideoReady] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const videoSize = defaultVideoSize;

  const animationFrameId = useRef(null); // Track the animation frame ID

  // ✅ Load Mediapipe Pose Detector
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
    loadPoseLandmarker();
  }, []);

  function drawCapsule(
    ctx,
    cx,
    cy,
    width,
    height,
    angle = 0,
    color = '#6AC66A'
  ) {
    const radius = width / 2;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(-radius, -height / 2 + radius);
    ctx.lineTo(-radius, height / 2 - radius);
    ctx.quadraticCurveTo(-radius, height / 2, 0, height / 2);
    ctx.quadraticCurveTo(radius, height / 2, radius, height / 2 - radius);
    ctx.lineTo(radius, -height / 2 + radius);
    ctx.quadraticCurveTo(radius, -height / 2, 0, -height / 2);
    ctx.quadraticCurveTo(-radius, -height / 2, -radius, -height / 2 + radius);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
  }

  function drawTaperedCapsuleLikeVertebra(
    ctx,
    cx,
    cy,
    topWidth,
    bottomWidth,
    height,
    angle = 0,
    color = '#6AC66A'
  ) {
    const radiusTop = topWidth / 2;
    const radiusBottom = bottomWidth / 2;

    ctx.beginPath();

    // Top arc (curved downward)
    ctx.moveTo(cx - radiusTop, cy - height / 2 + radiusTop);
    ctx.quadraticCurveTo(
      cx,
      cy - height / 2 + radiusTop * 2,
      cx + radiusTop,
      cy - height / 2 + radiusTop
    );

    // Right side
    ctx.lineTo(cx + radiusBottom, cy + height / 2 - radiusBottom);

    // Bottom arc
    ctx.quadraticCurveTo(
      cx + radiusBottom,
      cy + height / 2,
      cx,
      cy + height / 2
    );
    ctx.quadraticCurveTo(
      cx - radiusBottom,
      cy + height / 2,
      cx - radiusBottom,
      cy + height / 2 - radiusBottom
    );

    // Left side
    ctx.lineTo(cx - radiusTop, cy - height / 2 + radiusTop);

    ctx.closePath();

    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.save();
    ctx.beginPath();

    ctx.restore();
  }

  function drawSpineLikeReferenceOld(ctx, landmarks, color = '#6AC66A') {
    const ls = landmarks[11];
    const rs = landmarks[12];
    const lh = landmarks[23];
    const rh = landmarks[24];

    if ([ls, rs, lh, rh].some((l) => l.visibility < 0.75)) return;

    // const { width: W, height: H } = videoSize;
    const { width: W, height: H } = ctx.canvas;

    const topX = ((ls.x + rs.x) / 2) * W;
    const topY = ((ls.y + rs.y) / 2) * H;
    const bottomX = ((lh.x + rh.x) / 2) * W;
    const bottomY = ((lh.y + rh.y) / 2) * H;

    const dx = bottomX - topX;
    const dy = bottomY - topY;
    const spineAngle = Math.atan2(dy, dx);
    const spineLength = Math.hypot(dx, dy);

    const segmentCount = 6;
    const segmentLength = spineLength / segmentCount;

    const getPointAt = (i) => {
      const frac = i / segmentCount;
      return {
        x: topX + dx * frac,
        y: topY + dy * frac,
      };
    };

    ctx.save();
    ctx.fillStyle = color;

    const capsuleWidth = 40;
    const capsuleHeight = segmentLength * 0.3;

    for (let i = 0; i < 4; i++) {
      const center = getPointAt(i + 0.5);
      // drawCapsule(
      //   ctx,
      //   center.x,
      //   center.y,
      //   capsuleWidth,
      //   capsuleHeight,
      //   spineAngle,
      //   color
      // );
      drawTaperedCapsuleLikeVertebra(
        ctx,
        center.x,
        center.y,
        10,
        20,
        30,
        spineAngle,
        color
      );
    }

    // Optional: bottom round tip
    const bottom = getPointAt(4.5);
    drawCapsule(
      ctx,
      bottom.x,
      bottom.y,
      capsuleWidth,
      capsuleHeight,
      spineAngle,
      color
    );

    ctx.restore();
  }
  function drawDisc(ctx, cx, cy, width, height, angle = 0, color = '#A4D3A2') {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.beginPath();
    // ctx.rect(-width / 2, -height / 2, width, height);
    ctx.roundRect(-width / 2, -height / 2, width, 12, 4);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
  }

  function drawTaperedVertebra(
    ctx,
    cx,
    cy,
    topWidth,
    bottomWidth,
    height,
    _angle = 0, // ignored now
    color = '#6AC66A',
    borderColor = '#FFFFFF'
  ) {
    const radiusTop = topWidth / 2;
    const radiusBottom = bottomWidth / 2;

    ctx.beginPath();

    // Top arc (curved downward)
    ctx.moveTo(cx - radiusTop, cy - height / 2 + radiusTop);
    ctx.quadraticCurveTo(
      cx,
      cy - height / 2 + radiusTop * 2,
      cx + radiusTop,
      cy - height / 2 + radiusTop
    );

    // Right side
    ctx.lineTo(cx + radiusBottom, cy + height / 2 - radiusBottom);

    // Bottom arc
    ctx.quadraticCurveTo(
      cx + radiusBottom,
      cy + height / 2,
      cx,
      cy + height / 2
    );
    ctx.quadraticCurveTo(
      cx - radiusBottom,
      cy + height / 2,
      cx - radiusBottom,
      cy + height / 2 - radiusBottom
    );

    // Left side
    ctx.lineTo(cx - radiusTop, cy - height / 2 + radiusTop);

    ctx.closePath();

    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 2;
    ctx.stroke();
  }

  function drawSpineLikeReference(ctx, landmarks, color = '#6AC66A') {
    const ls = landmarks[11]; // Left shoulder
    const rs = landmarks[12]; // Right shoulder
    const lh = landmarks[23]; // Left hip
    const rh = landmarks[24]; // Right hip

    if ([ls, rs, lh, rh].some((l) => l.visibility < 0.75)) return;

    const { width: W, height: H } = ctx.canvas;

    // ✅ Midpoint between shoulders and hips
    const topX = ((ls.x + rs.x) / 2) * W;
    const topY = ((ls.y + rs.y) / 2) * H;
    const bottomX = ((lh.x + rh.x) / 2) * W;
    const bottomY = ((lh.y + rh.y) / 2) * H;

    const dx = bottomX - topX;
    const dy = bottomY - topY;
    const spineLength = Math.hypot(dx, dy);

    const ux = dx / spineLength;
    const uy = dy / spineLength;

    // ⬅️ Perpendicular direction (normalized)
    const nx = -uy;
    const ny = ux;

    const offsetDistance = 3;

    ctx.save();

    // 🎯 Dashed spine
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

    // ➖ Side lines (thin)
    ctx.lineWidth = 0.5;
    ctx.setLineDash([]); // solid

    // Left line
    ctx.beginPath();
    ctx.moveTo(topX - nx * offsetDistance, topY - ny * offsetDistance);
    ctx.lineTo(
      bottomX - nx * offsetDistance,
      bottomY - 20 - ny * offsetDistance
    );
    ctx.stroke();

    // Right line
    ctx.beginPath();
    ctx.moveTo(topX + nx * offsetDistance, topY + ny * offsetDistance);
    ctx.lineTo(
      bottomX + nx * offsetDistance,
      bottomY - 20 + ny * offsetDistance
    );
    ctx.stroke();

    ctx.restore();
  }

  const drawStylizedBone = (
    ctx,
    x1,
    y1,
    x2,
    y2,
    topWidth = 24,
    midWidth = 16,
    triangleLength = 20,
    color = '#6FC47A'
  ) => {
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

    // Draw border
    // const border = getPoints(1.15); // Slightly larger
    // ctx.save();
    // ctx.beginPath();
    // ctx.moveTo(border.x1Left, border.y1Left);
    // ctx.lineTo(border.x2Left, border.y2Left);
    // ctx.lineTo(tipX, tipY);
    // ctx.lineTo(border.x2Right, border.y2Right);
    // ctx.lineTo(border.x1Right, border.y1Right);
    // ctx.closePath();
    // ctx.fillStyle = 'white';
    // ctx.fill();
    // ctx.restore();

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
  };

  function drawShoulders(ctx, landmarks, transform, color = '#3CE7A2') {
    const right = landmarks[11];
    const left = landmarks[12];

    if (!right || !left || right.visibility < 0.75 || left.visibility < 0.75)
      return;

    const p1 = transform(right); // Point 11 (Right Shoulder)
    const p2 = transform(left); // Point 12 (Left Shoulder)

    const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
    const length = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    const widthStart = 5; // widest in middle
    const widthEnd = 3; // taper to edges

    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;

    const nx = Math.cos(angle + Math.PI / 2);
    const ny = Math.sin(angle + Math.PI / 2);

    const p1l = { x: p1.x + nx * widthEnd, y: p1.y + ny * widthEnd };
    const p1r = { x: p1.x - nx * widthEnd, y: p1.y - ny * widthEnd };

    const p2l = { x: p2.x + nx * widthEnd, y: p2.y + ny * widthEnd };
    const p2r = { x: p2.x - nx * widthEnd, y: p2.y - ny * widthEnd };

    const midLeft = { x: midX + nx * widthStart, y: midY + ny * widthStart };
    const midRight = { x: midX - nx * widthStart, y: midY - ny * widthStart };

    // Draw the shoulder path
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(p1l.x, p1l.y);
    ctx.lineTo(midLeft.x, midLeft.y);
    ctx.lineTo(p2l.x, p2l.y);
    ctx.lineTo(p2r.x, p2r.y);
    ctx.lineTo(midRight.x, midRight.y);
    ctx.lineTo(p1r.x, p1r.y);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    // Optional: Draw center joint circle
    ctx.beginPath();
    ctx.arc(midX, midY, 8, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();

    ctx.restore();
  }
  function drawShoulder(ctx, landmarks, transform, color = '#3CE7A2') {
    const right = landmarks[11];
    const left = landmarks[12];

    if (!right || !left || right.visibility < 0.75 || left.visibility < 0.75)
      return;

    const p1 = transform(right); // Right shoulder
    const p2 = transform(left); // Left shoulder

    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;

    ctx.save();

    // 👇 Curve downward to right shoulder
    ctx.beginPath();
    ctx.moveTo(midX, midY);
    ctx.quadraticCurveTo(
      midX + (p1.x - midX) * 0.3, // slight outward curve
      midY + 10, // 👈 lower Y for downward dip
      p1.x,
      p1.y
    );
    ctx.strokeStyle = color;
    // ctx.lineWidth = 4;
    ctx.lineWidth = 8;
    ctx.stroke();

    // 👇 Curve downward to left shoulder
    ctx.beginPath();
    ctx.moveTo(midX, midY);
    ctx.quadraticCurveTo(
      midX + (p2.x - midX) * 0.3,
      midY + 10, // 👈 lower Y for downward dip
      p2.x,
      p2.y
    );
    ctx.stroke();

    // 🎯 Draw center joint circle
    ctx.beginPath();
    ctx.arc(midX, midY, 5, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();

    ctx.restore();
  }

  function drawHip(ctx, landmarks, transform, color = '#3CE7A2') {
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
    const p1Inner = { x: p1.x - nx * hipRadius, y: p1.y - ny * hipRadius };

    const p2Outer = { x: p2.x + nx * hipRadius, y: p2.y + ny * hipRadius };
    const p2Inner = { x: p2.x - nx * hipRadius, y: p2.y - ny * hipRadius };

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

  const drawCallbackVideoSrc = (results) => {
    if (!results.landmarks[0] || !canvasRef.current || !videoRef.current)
      return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const video = videoRef.current;
    const landmarks = results.landmarks[0];

    // Get canvas size
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    // Get scaling based on actual rendered video area
    const { scaleX, scaleY } = getScaleOffset();

    const transform = (landmark) => ({
      x: landmark.x * video.videoWidth * scaleX,
      y: landmark.y * video.videoHeight * scaleY,
    });

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // Dynamic bone thickness (based on canvas height)
    const lineWidth = 5;
    // 🦴 Bone connections

    // const boneColor = '#3CE7A2';
    // const boneColor = '#5345b4';
    const boneColor = 'white';

    // 🩻 Spine image

    const thighBones = [
      // { points: [23, 25], style: { top: 20, bottom: 8, color: boneColor } },
      // { points: [24, 26], style: { top: 20, bottom: 8, color: boneColor } },

      { points: [11, 13], style: { top: 20, bottom: 8, color: boneColor } }, // Left upper arm
      { points: [13, 15], style: { top: 20, bottom: 8, color: boneColor } }, // Left lower arm
      { points: [12, 14], style: { top: 20, bottom: 8, color: boneColor } }, // Right upper arm
      { points: [14, 16], style: { top: 20, bottom: 8, color: boneColor } }, // Right lower arm

      { points: [23, 25], style: { top: 20, bottom: 8, color: boneColor } }, // Left upper leg
      { points: [25, 27], style: { top: 20, bottom: 8, color: boneColor } }, // Left lower leg
      { points: [24, 26], style: { top: 20, bottom: 8, color: boneColor } }, // Right upper leg
      { points: [26, 28], style: { top: 20, bottom: 8, color: boneColor } }, // Right lower leg

      // { points: [11, 12], style: { top: 20, bottom: 8, color: boneColor } }, // Shoulders
      // { points: [23, 24], style: { top: 20, bottom: 8, color: boneColor } }, // Hips

      // { points: [0, 11], style: { thickness: lineWidth, color: boneColor } }, // Neck to L Shoulder
      // { points: [0, 12], style: { thickness: lineWidth, color: boneColor } }, // Neck to R Shoulder
      // { points: [11, 23], style: { top: 20, bottom: 8, color: boneColor } }, // Left torso
      // { points: [12, 24], style: { top: 20, bottom: 8, color: boneColor } }, // Right torso
    ];

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

      drawStylizedBone(ctx, p1.x, p1.y, p2.x, p2.y, 20, 2, 2, boneColor);
      drawSpineLikeReference(ctx, landmarks, boneColor);
    });

    drawShoulder(ctx, landmarks, transform, boneColor);
    drawHip(ctx, landmarks, transform, boneColor);

    // 🔵 Landmarks
    landmarks.forEach((lm, idx) => {
      // if (lm.visibility < drawOptions.visibilityMin) return;
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

  const getScaleOffset = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas)
      return { scaleX: 1, scaleY: 1, offsetX: 0, offsetY: 0 };

    const canvasRect = canvas.getBoundingClientRect();
    const videoWidth = video.videoWidth;
    const videoHeight = video.videoHeight;

    const scaleX = canvasRect.width / videoWidth;
    const scaleY = canvasRect.height / videoHeight;

    return { scaleX, scaleY, offsetX: 0, offsetY: 0 }; // offset no longer needed with 'contain' fix
  };

  const runPoseDetection = async () => {
    const video = videoRef.current;

    if (!video || !poseLandmarker) return;

    const detect = async () => {
      if (!poseLandmarker) return;

      const startTimeMs = performance.now();
      try {
        // await poseLandmarker.detectForVideo(video, startTimeMs, drawCallback);
        await poseLandmarker.detectForVideo(
          video,
          startTimeMs,
          drawCallbackVideoSrc
        );
      } catch (error) {
        console.log('PoseLandmarker Error:', error);
        return;
      }

      animationFrameId.current = requestAnimationFrame(detect);
    };

    detect();
  };

  useEffect(() => {
    if (poseLandmarker && videoReady) {
      runPoseDetection();
    }
  }, [poseLandmarker, videoReady]);

  const switchVideo = (src) => {
    // 💣 Stop previous detection
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }

    // 🧽 Clear canvas
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    ctx?.clearRect(0, 0, canvas.width, canvas.height);

    // 👇 Set video
    setVideoSrc(src);
    setVideoReady(false);
  };

  const stopPoseDetection = () => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  };
  useEffect(() => {
    const videoEl = videoRef.current;
    return () => {
      videoEl?.removeEventListener('pause', stopPoseDetection);
      videoEl?.removeEventListener('ended', stopPoseDetection);
    };
  }, [videoSrc]);

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
          <video
            id="video"
            autoPlay
            playsInline
            ref={videoRef}
            src={videoSrc}
            controls
            onLoadedMetadata={() => {
              const video = videoRef.current;
              const canvas = canvasRef.current;

              if (video && canvas) {
                const rect = video.getBoundingClientRect(); // Get actual rendered size
                canvas.width = rect.width;
                canvas.height = rect.height;
              }
              // Reset frame loop before starting again
              if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
                animationFrameId.current = null;
              }
              // Clear previous detection loop
              stopPoseDetection();

              // 👇 Add listeners
              const videoEl = videoRef.current;
              videoEl?.addEventListener('pause', stopPoseDetection);
              videoEl?.addEventListener('ended', stopPoseDetection);
              // videoEl.addEventListener('play', resumePoseDetection);
              setVideoReady(true);
            }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              // objectFit: 'cover',
              objectFit: 'contain',
              zIndex: 1,
            }}
          />
          <canvas
            ref={canvasRef}
            // width={videoSize.width}
            // height={videoSize.height}
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
        </div>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
        <Button label="Jump" onClick={() => switchVideo(jump)} />
        <Button label="Yoga" onClick={() => switchVideo(yog)} />
        <Button label="Split" onClick={() => switchVideo(split)} />
        <Button label="Weight" onClick={() => switchVideo(weight)} />
        <Button label="Dance" onClick={() => switchVideo(dance)} />
      </div>
    </div>
  );
};

export default PoseTrackerWithUpload;
