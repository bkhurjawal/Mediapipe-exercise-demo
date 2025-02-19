import React, { useEffect, useRef, useState } from 'react';

const drawKeypoints = (keypoints, ctx) => {
  if (!ctx) return;
  keypoints.forEach((keypoint) => {
    const { x, y, score } = keypoint;
    if (score > 0.5) {
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 2 * Math.PI);
      ctx.fillStyle = 'red';
      ctx.fill();
    }
  });
};

const drawSkeleton = (keypoints, ctx) => {
  if (!ctx) return;
  for (let i = 0; i < keypoints.length - 1; i++) {
    const partA = keypoints[i];
    const partB = keypoints[i + 1];
    ctx.beginPath();
    ctx.moveTo(partA.x, partA.y);
    ctx.lineTo(partB.x, partB.y);
    ctx.strokeStyle = 'blue';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
};

const calculateAngle = (point1, point2, point3) => {
  const angle =
    (Math.atan2(point3.y - point2.y, point3.x - point2.x) -
      Math.atan2(point1.y - point2.y, point1.x - point2.x)) *
    (180 / Math.PI);
  return Math.abs(angle);
};

const PoseEstimation = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [leftArmAngle, setLeftArmAngle] = useState(null);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    const startOpenPose = async () => {
      console.log(
        'Ensure OpenPose is running separately and processing frames'
      );
    };
    startOpenPose();
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
  }, [canvasRef]);

  return (
    <div className="flex flex-col items-center p-4">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="absolute hidden"
        width="640"
        height="480"
      />
      <canvas
        ref={canvasRef}
        className="border rounded-xl"
        width="640"
        height="480"
      />
      <p className="mt-4 text-xl font-semibold">
        Left Arm Flexion Angle: {leftArmAngle?.toFixed(2)}°
      </p>
      <p className="mt-2 text-lg text-blue-600">{feedback}</p>
    </div>
  );
};

export default PoseEstimation;
