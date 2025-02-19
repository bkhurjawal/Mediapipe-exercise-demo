import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';
import React, { useEffect, useRef, useState } from 'react';
// import { DrawingUtils } from 'https://unpkg.com/@mediapipe/tasks-vision@0.10.21/vision_bundle.mjs';
import { DrawingUtils } from 'https://unpkg.com/@mediapipe/tasks-vision@0.10.21-rc.20250110/vision_bundle.mjs';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { Toast } from 'primereact/toast';

const PoseFrame = () => {
  const [poseLandmarker, setPoseLandmarker] = useState(null);
  const [webcamRunning, setWebcamRunning] = useState(false);
  const [insideFrame, setInsideFrame] = useState(false);
  const [toastActive, setToastActive] = useState(false);
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState('top');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const toast = useRef(null);

  // Define the frame boundaries
  const frameLeft = 500;
  const frameTop = 20;
  const frameWidth = 480;
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
      // toast.error('PoseLandmarker not loaded yet.');
      return;
    }
    setWebcamRunning((prev) => !prev);
  };

  const runStream = async () => {
    const video = videoRef.current;
    if (webcamRunning) {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      video.srcObject = stream;
      video.addEventListener('loadeddata', () => predictWebcam());
    } else {
      const tracks = video.srcObject?.getTracks();
      tracks?.forEach((track) => track.stop());
      video.srcObject = null;
    }
  };

  useEffect(() => {
    if (webcamRunning) {
      runStream();
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
      // toast.current.show({
      //   severity: 'success',
      //   summary: 'Great!',
      //   detail: "That's the spot!",
      //   life: 3000, // Auto dismiss after 3 seconds
      // });
    }
  };

  const predictWebcam = async () => {
    if (!poseLandmarker || !webcamRunning) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const drawingUtils = new DrawingUtils(ctx);

    const detectFrame = async () => {
      const results = await poseLandmarker.detectForVideo(
        video,
        performance.now()
      );
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      let userInside = false;

      if (results?.landmarks.length > 0) {
        const landmarks = results.landmarks[0];
        userInside = isWithinFrame(landmarks);

        // ✅ Show Toast when user enters the frame
        if (userInside && !insideFrame) {
          if (!toastActive) {
            showCustomToast();
            setToastActive(true); // Set toastActive to true
          }
        }

        // ✅ Draw Mediapipe Skeleton
        drawingUtils.drawConnectors(
          landmarks,
          PoseLandmarker.POSE_CONNECTIONS,
          {
            color: userInside ? 'green' : 'blue', // Change color
            lineWidth: 5,
          }
        );

        drawingUtils.drawLandmarks(landmarks, {
          radius: 4,
          color: userInside ? 'green' : 'blue',
        });

        setInsideFrame(userInside);
      }

      if (!userInside) {
        // Draw the dark overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';

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
        requestAnimationFrame(detectFrame);
      }
    };

    detectFrame();
  };

  return (
    <div className="grid bg-gray-100 p-4 ">
      {/* Video & Canvas Section */}
      <div style={{ position: 'relative' }}>
        {/* Video Player */}
        <div>
          <video
            ref={videoRef}
            // className="rounded-lg"
            // className="w-full h-full"
            style={{
              width: '1280px',
              height: '720px',

              position: 'absolute',
            }}
            autoPlay
            playsInline
          ></video>
          <canvas
            ref={canvasRef}
            width="1280"
            height="720"
            // className="w-full h-full"
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
            }}
          ></canvas>
        </div>
      </div>

      {/* Toast Notification */}
      <Toast ref={toast} position="top-center" />

      {/* Button to Show Dialog */}
      <Button
        label="Open Webcam"
        icon="pi pi-check"
        className="p-button-success mt-4"
        onClick={handleEnableWebcam}
        // onClick={() => setVisible(true)}
      />
      <Button
        label="Feedback"
        icon="pi pi-check"
        className="p-button-success mt-4"
        // onClick={handleEnableWebcam}
        onClick={() => setVisible(true)}
      />

      {/* Feedback Dialog */}
      <Dialog
        // header="Header"
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
            <p className="text-lg font-semibold">Great! That's the spot!</p>
          </div>
        )}
      ></Dialog>
    </div>
  );

  return (
    <div className="card flex flex-column align-items-center justify-content-center">
      <Button severity="secondary" onClick={handleEnableWebcam}>
        <span>{webcamRunning ? 'DISABLE WEBCAM' : 'ENABLE WEBCAM'}</span>
      </Button>

      <div style={{ position: 'relative' }}>
        <video
          ref={videoRef}
          style={{
            width: '1280px',
            height: '720px',
            position: 'absolute',
          }}
          autoPlay
          playsInline
        ></video>
        <canvas
          ref={canvasRef}
          width="1280"
          height="720"
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
          }}
        ></canvas>
      </div>
      <Toast ref={toast} position="top-center" />
      <Dialog
        // header="Header"
        visible={visible}
        position={position}
        style={{ width: '50vw' }}
        onHide={() => {
          if (!visible) return;
          setVisible(false);
        }}
        draggable={false}
        resizable={false}
        content={({ hide }) => (
          <div
            className="flex flex-column px-6 py-4 gap-4 text-center "
            style={{ backgroundColor: `rgba(210, 37, 28, 0.57)` }}
          >
            <p className="text-lg font-semibold">Great! That's the spot!</p>
          </div>
        )}
      ></Dialog>
    </div>
  );
};

export default PoseFrame;
