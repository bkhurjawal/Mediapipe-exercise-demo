import React, { useEffect, useRef, useState, useCallback } from 'react';
import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';
import {
  boneColor,
  defaultVideoSize,
  drawHip,
  drawOptions,
  drawShoulders,
  drawSpineLikeReference,
  drawStylizedBone,
  landmarksToRemove,
} from '../util/skeletonMedia';

// Reference height in cm - used for calibration
const REFERENCE_HEIGHT_CM = 170;

const MediapipeSkeletonPlayer = () => {
  const [poseLandmarker, setPoseLandmarker] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animationFrameId = useRef(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [personHeight, setPersonHeight] = useState(null);
  const [pixelsPerCm, setPixelsPerCm] = useState(null);
  const [userEnteredHeight, setUserEnteredHeight] =
    useState(REFERENCE_HEIGHT_CM);
  const [showHeightInput, setShowHeightInput] = useState(true);
  const [calibrationMode, setCalibrationMode] = useState(false);
  const [postureMetrics, setPostureMetrics] = useState({
    shoulderTiltDegrees: null,
    shoulderTiltCm: null,
    forwardHeadDegrees: null,
    forwardHeadCm: null,
  });

  // Height calculation utilities
  const midpoint = (p1, p2) => {
    return {
      x: (p1.x + p2.x) / 2,
      y: (p1.y + p2.y) / 2,
      z: (p1.z + p2.z) / 2,
    };
  };

  const calculatePixelDistance = (p1, p2) => {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const estimatePixelsPerCm = (headY, ankleY, heightCm) => {
    const pixelHeight = Math.abs(ankleY - headY);
    return pixelHeight / heightCm;
  };

  const convertPixelsToCm = (pixelValue, pixelsPerCm) => {
    return pixelValue / pixelsPerCm;
  };

  const calculateAngle = (p1, p2, p3) => {
    // Vector 1 (p1 to p2)
    const v1 = {
      x: p1.x - p2.x,
      y: p1.y - p2.y,
    };

    // Vector 2 (p3 to p2)
    const v2 = {
      x: p3.x - p2.x,
      y: p3.y - p2.y,
    };

    // Dot product
    const dotProduct = v1.x * v2.x + v1.y * v2.y;

    // Magnitudes
    const v1Mag = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
    const v2Mag = Math.sqrt(v2.x * v2.x + v2.y * v2.y);

    // Angle in radians then converted to degrees
    const angleRad = Math.acos(
      Math.min(Math.max(dotProduct / (v1Mag * v2Mag), -1.0), 1.0)
    );
    return angleRad * (180 / Math.PI);
  };

  // Draw height measurement line
  function drawHeightMeasurement(ctx, landmarks, transform, pixelsPerCm) {
    // Use ears and ankles to measure height
    const leftEar = landmarks[7];
    const rightEar = landmarks[8];
    const leftAnkle = landmarks[27];
    const rightAnkle = landmarks[28];

    if (
      [leftEar, rightEar, leftAnkle, rightAnkle].some(
        (lm) => lm.visibility < 0.5
      )
    )
      return;

    const headPoint = midpoint(transform(leftEar), transform(rightEar));
    const anklePoint = midpoint(transform(leftAnkle), transform(rightAnkle));

    // Draw height line
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(headPoint.x, headPoint.y);
    ctx.lineTo(headPoint.x, anklePoint.y);
    ctx.strokeStyle = '#4ECDC4';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.stroke();

    // Draw markers at top and bottom
    ctx.beginPath();
    ctx.arc(headPoint.x, headPoint.y, 5, 0, 2 * Math.PI);
    ctx.fillStyle = '#FF6B6B';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(headPoint.x, anklePoint.y, 5, 0, 2 * Math.PI);
    ctx.fillStyle = '#FF6B6B';
    ctx.fill();

    // Display height if pixelsPerCm is available
    if (pixelsPerCm) {
      const heightPixels = Math.abs(anklePoint.y - headPoint.y);
      const heightCm = heightPixels / pixelsPerCm;

      ctx.font = '16px Arial';
      ctx.fillStyle = 'white';
      ctx.textAlign = 'left';
      ctx.fillText(
        `Est. Height: ${heightCm.toFixed(1)} cm`,
        headPoint.x + 10,
        (headPoint.y + anklePoint.y) / 2
      );
    }

    ctx.restore();
  }

  // Draw posture metrics
  function drawPostureMetrics(ctx, metrics) {
    ctx.save();
    ctx.font = '16px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'left';

    let y = 30;
    const x = 20;

    if (metrics.shoulderTiltDegrees !== null) {
      ctx.fillText(
        `Shoulder Tilt: ${metrics.shoulderTiltDegrees.toFixed(
          1
        )}° (${metrics.shoulderTiltCm.toFixed(1)} cm)`,
        x,
        y
      );
      y += 25;
    }

    if (metrics.forwardHeadDegrees !== null) {
      ctx.fillText(
        `Forward Head: ${metrics.forwardHeadDegrees.toFixed(1)}°`,
        x,
        y
      );
      y += 25;
    }

    ctx.restore();
  }

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

    return { scaleX, scaleY, offsetX: 0, offsetY: 0 };
  };

  const calculatePostureMetrics = (landmarks, transform) => {
    const metrics = {
      shoulderTiltDegrees: null,
      shoulderTiltCm: null,
      forwardHeadDegrees: null,
      forwardHeadCm: null,
    };

    // Get relevant landmarks
    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const leftEar = landmarks[7];
    const rightEar = landmarks[8];
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];

    if (leftShoulder.visibility > 0.7 && rightShoulder.visibility > 0.7) {
      // Calculate shoulder tilt angle
      const lsPoint = transform(leftShoulder);
      const rsPoint = transform(rightShoulder);
      const horizontalReference = { x: rsPoint.x, y: lsPoint.y };

      metrics.shoulderTiltDegrees = calculateAngle(
        lsPoint,
        rsPoint,
        horizontalReference
      );

      // Calculate shoulder height difference in cm
      const heightDiffPixels = Math.abs(lsPoint.y - rsPoint.y);
      metrics.shoulderTiltCm = pixelsPerCm
        ? heightDiffPixels / pixelsPerCm
        : null;
    }

    if (
      leftEar.visibility > 0.7 &&
      leftShoulder.visibility > 0.7 &&
      leftHip.visibility > 0.7
    ) {
      // Calculate forward head angle (ear-shoulder-hip)
      const earPoint = transform(leftEar);
      const shoulderPoint = transform(leftShoulder);
      const hipPoint = transform(leftHip);

      metrics.forwardHeadDegrees = calculateAngle(
        earPoint,
        shoulderPoint,
        hipPoint
      );
    }

    return metrics;
  };

  const drawCallback = useCallback(
    (results) => {
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
        z: landmark.z || 0,
      });

      ctx.clearRect(0, 0, canvasWidth, canvasHeight);

      // Calculate height if needed
      const leftEar = landmarks[7];
      const rightEar = landmarks[8];
      const leftAnkle = landmarks[27];
      const rightAnkle = landmarks[28];

      if (
        [leftEar, rightEar, leftAnkle, rightAnkle].every(
          (lm) => lm.visibility > 0.5
        )
      ) {
        const head = midpoint(transform(leftEar), transform(rightEar));
        const ankle = midpoint(transform(leftAnkle), transform(rightAnkle));

        const heightPixels = Math.abs(ankle.y - head.y);

        // Update pixels per cm if we're in calibration mode or it hasn't been set yet
        if (calibrationMode || pixelsPerCm === null) {
          const calculatedPixelsPerCm = estimatePixelsPerCm(
            head.y,
            ankle.y,
            userEnteredHeight
          );
          setPixelsPerCm(calculatedPixelsPerCm);
          setCalibrationMode(false);
        }

        // Calculate estimated height using current pixels per cm
        if (pixelsPerCm) {
          const estimatedHeight = heightPixels / pixelsPerCm;
          setPersonHeight(estimatedHeight);
        }

        // Draw height measurement line
        drawHeightMeasurement(ctx, landmarks, transform, pixelsPerCm);
      }

      // Calculate posture metrics
      const currentPostureMetrics = calculatePostureMetrics(
        landmarks,
        transform
      );
      setPostureMetrics(currentPostureMetrics);

      // Draw posture metrics
      drawPostureMetrics(ctx, currentPostureMetrics);

      const bonePairs = [
        { points: [11, 13], style: { top: 20, bottom: 8, color: boneColor } }, // Left upper arm
        { points: [13, 15], style: { top: 20, bottom: 8, color: boneColor } }, // Left lower arm
        { points: [12, 14], style: { top: 20, bottom: 8, color: boneColor } }, // Right upper arm
        { points: [14, 16], style: { top: 20, bottom: 8, color: boneColor } }, // Right lower arm
        { points: [23, 25], style: { top: 20, bottom: 8, color: boneColor } }, // Left upper leg
        { points: [25, 27], style: { top: 20, bottom: 8, color: boneColor } }, // Left lower leg
        { points: [24, 26], style: { top: 20, bottom: 8, color: boneColor } }, // Right upper leg
        { points: [26, 28], style: { top: 20, bottom: 8, color: boneColor } }, // Right lower leg
      ];

      bonePairs.forEach(({ points: [startIdx, endIdx], style }) => {
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
      drawShoulders(ctx, landmarks, transform, boneColor);
      drawHip(ctx, landmarks, transform, boneColor);

      // Draw landmarks
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
    [pixelsPerCm, userEnteredHeight, calibrationMode, getScaleOffset]
  );

  const runPoseDetection = useCallback(() => {
    const video = videoRef.current;

    if (!video || !poseLandmarker) return;

    const detect = async () => {
      if (!poseLandmarker) return;

      const startTimeMs = performance.now();
      try {
        await poseLandmarker.detectForVideo(video, startTimeMs, drawCallback);
      } catch (error) {
        console.log('PoseLandmarker Error:', error);
        return;
      }

      animationFrameId.current = requestAnimationFrame(detect);
    };

    detect();
  }, [poseLandmarker, drawCallback]);

  const stopPoseDetection = useCallback(() => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  // Initialize the pose landmarker
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
          runningMode: 'VIDEO',
          numPoses: 1,
          minPoseDetectionConfidence: 0.6,
          minTrackingConfidence: 0.6,
        });

        setPoseLandmarker(landmarker);
      } catch (error) {
        console.error('Error loading pose landmarker:', error);
      }
    };

    loadPoseLandmarker();

    return () => {
      stopPoseDetection();
    };
  }, [stopPoseDetection]);

  // Set up webcam
  useEffect(() => {
    const setupCamera = async () => {
      const video = videoRef.current;
      if (!video) return;

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: defaultVideoSize.width },
            height: { ideal: defaultVideoSize.height },
            facingMode: 'user',
          },
          audio: false,
        });

        video.srcObject = stream;
        video.addEventListener('loadedmetadata', () => {
          setCameraReady(true);
        });
      } catch (error) {
        console.error('Error accessing webcam:', error);
      }
    };

    setupCamera();

    return () => {
      const video = videoRef.current;
      if (video && video.srcObject) {
        const stream = video.srcObject;
        const tracks = stream.getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, []);

  // Start pose detection when camera and pose landmarker are ready
  useEffect(() => {
    if (poseLandmarker && cameraReady) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        runPoseDetection();
      }
    }

    return () => {
      stopPoseDetection();
    };
  }, [poseLandmarker, cameraReady, runPoseDetection, stopPoseDetection]);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'black',
        minHeight: '100vh',
        width: '100%',
        color: 'white',
        padding: '2rem',
      }}
    >
      {showHeightInput && (
        <div
          style={{
            // marginBottom: '20px',
            padding: '15px',
            backgroundColor: '#1f1f1f',
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            // gap: '10px',
          }}
        >
          <div>
            {personHeight && postureMetrics && (
              <p style={{ fontSize: 40 }}>
                Estimated Height: {personHeight.toFixed(1)}cm
                {'   '}
                Shoulder Tilt: {postureMetrics.shoulderTiltDegrees.toFixed(1)}°
                ({postureMetrics.shoulderTiltCm.toFixed(1)} cm)
              </p>
            )}
          </div>
        </div>
      )}

      <div
        style={{
          position: 'relative',
          width: '1280px',
          height: '720px',
          maxWidth: '100%',
          maxHeight: '80vh',
          backgroundColor: '#1f1f1f',
          borderRadius: '12px',
          overflow: 'hidden',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          onLoadedMetadata={() => {
            const video = videoRef.current;
            const canvas = canvasRef.current;

            if (video && canvas) {
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
            }
          }}
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
      </div>

      {personHeight && !showHeightInput && (
        <div
          style={{
            marginTop: '20px',
            padding: '10px 20px',
            backgroundColor: '#1f1f1f',
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <h3>Measurements</h3>
          <p>Estimated Height: {personHeight.toFixed(1)} cm</p>
          {postureMetrics.shoulderTiltDegrees !== null && (
            <p>
              Shoulder Tilt: {postureMetrics.shoulderTiltDegrees.toFixed(1)}° (
              {postureMetrics.shoulderTiltCm.toFixed(1)} cm)
            </p>
          )}
          {postureMetrics.forwardHeadDegrees !== null && (
            <p>
              Forward Head Angle: {postureMetrics.forwardHeadDegrees.toFixed(1)}
              °
            </p>
          )}
          <button
            onClick={() => setShowHeightInput(true)}
            style={{
              marginTop: '10px',
              padding: '6px 12px',
              backgroundColor: '#4ECDC4',
              border: 'none',
              borderRadius: '4px',
              color: 'white',
              cursor: 'pointer',
            }}
          >
            Recalibrate
          </button>
        </div>
      )}
    </div>
  );
};

export default MediapipeSkeletonPlayer;
