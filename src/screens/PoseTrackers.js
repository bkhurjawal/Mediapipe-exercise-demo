import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';
import { DrawingUtils } from 'https://unpkg.com/@mediapipe/tasks-vision@0.10.21-rc.20250110/vision_bundle.mjs';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import React, { useEffect, useRef, useState } from 'react';
import { Messages } from './Messages';
import { angleAtPivot, skeletonColors } from './helpers';

const PoseTracker = () => {
  const [poseLandmarker, setPoseLandmarker] = useState(null);
  const [webcamRunning, setWebcamRunning] = useState(false);
  const [insideFrame, setInsideFrame] = useState(false);
  const [toastActive, setToastActive] = useState(false);
  const [message, setMessage] = useState(Messages.GET_BACK);
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState('top');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const toast = useRef(null);
  const animationFrameId = useRef(null); // Track the animation frame ID

  // Define the frame boundaries
  const frameLeft = 300;
  const frameTop = 20;
  const frameWidth = 680;
  const frameHeight = 660;

  // ✅ Load Mediapipe Pose Detector
  useEffect(() => {
    const loadPoseLandmarker = async () => {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm'
      );
      const landmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
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

  // ✅ Handle Webcam Toggle
  const handleEnableWebcam = async () => {
    if (!poseLandmarker) {
      toast.error('PoseLandmarker not loaded yet.');
      return;
    }
    setWebcamRunning((prev) => !prev);
  };

  const predictWebcam = async () => {
    if (!poseLandmarker || !webcamRunning) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const drawingUtils = new DrawingUtils(ctx);

    console.log('drawingUtils', drawingUtils);
    console.log('ctx', ctx);

    const detectFrame = async () => {
      if (!video.videoWidth || !video.videoHeight) {
        // If the video stream is invalid, stop processing
        if (animationFrameId.current) {
          cancelAnimationFrame(animationFrameId.current);
          animationFrameId.current = null;
        }
        return;
      }

      const results = await poseLandmarker.detectForVideo(
        video,
        performance.now()
      );
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let userInside = false;

      if (results?.landmarks.length > 0) {
        const landmarks = results.landmarks[0];
        userInside = isWithinFrame(landmarks);

        drawingUtils.drawConnectors(
          landmarks,
          PoseLandmarker.POSE_CONNECTIONS,
          {
            color: skeletonColors.left_shoulder_hand, // Use custom color for connectors
            lineWidth: 5,
          }
        );

        landmarks.forEach((landmark, index) => {
          const landmarkName = Object.keys(skeletonColors)[index];
          const color = skeletonColors[landmarkName] || 'rgb(255, 255, 255)'; // Default to white if color not found
          drawingUtils.drawLandmarks([landmark], {
            radius: 4,
            color: color,
          });
        });

        const leftEar = landmarks[7];
        const leftShoulder = landmarks[11];

        // if (leftEar && leftShoulder) {
        //   const angleHorizontal = computeAngle(leftEar, leftShoulder);
        //   // Convert from horizontal to an approximate neck flexion from vertical
        //   const neckFlexion = Math.abs(90 - angleHorizontal);

        //   // Draw angle text on canvas
        //   ctx.save();
        //   ctx.font = '20px Arial';
        //   ctx.fillStyle = 'red';
        //   ctx.fillText(`Neck Flexion: ${neckFlexion.toFixed(1)}°`, 70, 50);
        //   ctx.restore();
        // }

        const rightElbow = landmarks[14];
        const rightWrist = landmarks[16];
        const rightIndex = landmarks[21];

        // if (rightElbow && rightWrist && rightIndex) {
        //   const angleRadians = angleAtPivot(rightElbow, rightWrist, rightIndex);
        //   const angleDegrees = (angleRadians * 180) / Math.PI;

        //   // 4) Draw the angle on canvas
        //   ctx.save();
        //   ctx.font = '20px Arial';
        //   ctx.fillStyle = 'white';
        //   ctx.fillText(`Hand Flexion: ${angleDegrees.toFixed(1)}°`, 100, 30);
        //   ctx.fillText(`Hand Flexion: ${angleDegrees.toFixed(1)}°`, 0, 0);

        //   ctx.restore();
        // }

        setInsideFrame(userInside);
      }

      if (!userInside) {
        // Draw the dark overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Create a transparent cutout inside the red frame
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = 'rgba(0, 0, 0, 1)';
        ctx.beginPath();
        ctx.roundRect(frameLeft, frameTop, frameWidth, frameHeight, 15);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';

        // Draw the red frame
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.roundRect(frameLeft, frameTop, frameWidth, frameHeight, 15);
        ctx.stroke();
      }

      if (webcamRunning) {
        animationFrameId.current = requestAnimationFrame(detectFrame); // Store the animation frame ID
      }
    };

    detectFrame();
  };

  const runStream = async () => {
    const video = videoRef.current;
    if (webcamRunning) {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (!video) {
        return;
      }
      video.srcObject = stream;
      video.addEventListener('loadeddata', () => predictWebcam());
    } else {
      if (!video.srcObject) return;
      const tracks = video.srcObject?.getTracks();
      tracks?.forEach((track) => track.stop());
      video.srcObject = null;

      // Stop the animation frame loop
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (webcamRunning) {
      runStream();
    } else {
      if (video.srcObject) {
        // Clear the canvas to remove the last frame
        const canvas = canvasRef.current;
        if (canvas) {
          const ctx = canvas.getContext('2d');
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        const tracks = video.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
        videoRef.current.srcObject = null;

        // Stop the animation frame loop
        if (animationFrameId.current) {
          cancelAnimationFrame(animationFrameId.current);
          animationFrameId.current = null;
        }
      }
    }
  }, [webcamRunning]);

  // ✅ Check if user is inside the frame
  const isWithinFrame = (landmarks) => {
    return landmarks.every(
      (lm) =>
        lm.x * 1280 > frameLeft &&
        lm.x * 1280 < frameLeft + frameWidth &&
        lm.y * 720 > frameTop &&
        lm.y * 720 < frameTop + frameHeight
    );
  };

  useEffect(() => {
    if (visible) {
      setTimeout(() => {
        setVisible(false);
      }, 3000);
    }
  }, [visible]);

  // ✅ Custom Animated Toast
  const showCustomToast = () => {
    if (!toastActive) {
      setPosition(position);
      setVisible(true);
    }
  };

  return (
    <div className="flex flex-column justify-content-center align-items-center min-h-screen bg-black text-white">
      {/* Video & Canvas Section */}
      <div className="w-10 md:w-6 flex justify-content-center">
        <div className="relative w-full h-96 bg-black flex justify-content-center align-items-center border-round-xl">
          {/* Video Player */}
          <video ref={videoRef} autoPlay playsInline></video>

          {/* Pose Detection Canvas */}
          <canvas
            ref={canvasRef}
            width="1280"
            height="720"
            className="absolute w-full h-full border-round-xl"
          ></canvas>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 mt-4">
        <Button
          label="Toggle Webcam"
          icon="pi pi-video"
          className="p-button-success"
          onClick={handleEnableWebcam}
        />
        <Button
          label="Show Feedback"
          icon="pi pi-info-circle"
          className="p-button-primary"
          onClick={() => setVisible(true)}
        />
      </div>

      {/* Feedback Dialog */}
      <Dialog
        visible={visible}
        position={position}
        style={{ width: '30vw' }}
        className="text-white"
        onHide={() => {
          if (!visible) return;
          setVisible(false);
        }}
        draggable={false}
        resizable={false}
        content={({ hide }) => (
          <div
            className="flex flex-column px-6 py-4 gap-4 text-center "
            style={{ backgroundColor: `rgba(28, 210, 58, 0.57)` }}
          >
            <p className="text-lg font-semibold">{message}</p>
          </div>
        )}
      ></Dialog>
    </div>
  );
};

export default PoseTracker;
