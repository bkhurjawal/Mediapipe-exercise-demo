import React, { useState, useRef, useEffect } from 'react';
import { PoseLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';
import { DrawingUtils } from 'https://unpkg.com/@mediapipe/tasks-vision@0.10.21-rc.20250110/vision_bundle.mjs';

const PoseEstimator = () => {
  const [poseLandmarker, setPoseLandmarker] = useState(null);
  const [webcamRunning, setWebcamRunning] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

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

  const handleEnableWebcam = async () => {
    if (!poseLandmarker) {
      console.log('PoseLandmarker not loaded yet.');
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      console.warn('getUserMedia() is not supported by your browser');
      return;
    }

    setWebcamRunning((prev) => !prev);
  };

  const runStream = async () => {
    const constraints = { video: true };
    const video = videoRef.current;
    if (webcamRunning) {
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      video.srcObject = stream;
      video.addEventListener('loadeddata', () => predictWebcam());
    } else {
      const tracks = video.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
      video.srcObject = null;
    }
  };

  useEffect(() => {
    if (webcamRunning) {
      runStream();
    }
  }, [webcamRunning]);

  const calculateAngle = (p1, p2, p3) => {
    const angle =
      (Math.atan2(p3.y - p2.y, p3.x - p2.x) -
        Math.atan2(p1.y - p2.y, p1.x - p2.x)) *
      (180 / Math.PI);
    return Math.abs(angle);
  };

  const giveFeedback = (landmarks) => {
    // Example: Elbow angle between shoulder, elbow, and wrist
    const shoulder = landmarks[11]; // Left shoulder
    const elbow = landmarks[13]; // Left elbow
    const wrist = landmarks[15]; // Left wrist

    const angle = calculateAngle(shoulder, elbow, wrist);

    let feedback = '';
    if (angle > 160) {
      feedback = 'Your elbow is overextended. Try to lower your arm slightly.';
    } else if (angle < 40) {
      feedback = 'Your elbow is too bent. Try to straighten it a bit.';
    }

    return feedback;
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
      ctx.save();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Flip the canvas horizontally to match the video
      ctx.save();
      // ctx.scale(-1, 1); // Flip horizontally
      // ctx.translate(-canvas.width, 0); // Adjust position after flip
      // ctx.drawImage(video, 0, 0, canvas.width, canvas.height); // Draw the video flipped
      // ctx.restore();

      if (results?.landmarks) {
        results.landmarks.forEach((landmarks) => {
          // Draw the landmarks
          drawingUtils.drawLandmarks(landmarks, {
            radius: 5, // Adjust the radius of the dots
            color: 'red', // Dot color
          });

          // Draw the connectors
          drawingUtils.drawConnectors(
            landmarks,
            PoseLandmarker.POSE_CONNECTIONS,
            {
              color: 'blue', // Line color
              lineWidth: 5, // Line width
            }
          );

          // Provide feedback based on pose
          const feedback = giveFeedback(landmarks);
          if (feedback) {
            // Draw the feedback text without flipping
            // ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset any transform before drawing text
            ctx.font = '20px Arial';
            ctx.fillStyle = 'orange';
            ctx.fillText(feedback, 20, 50); // Position the feedback text properly
            ctx.restore();
          }
        });
      }

      ctx.restore();

      if (webcamRunning) {
        requestAnimationFrame(detectFrame);
      }
    };

    detectFrame();
  };

  return (
    <section className={!poseLandmarker ? 'invisible' : ''}>
      <h2>Webcam continuous pose landmarks detection</h2>
      <p>
        Stand in front of your webcam to get real-time pose landmarker
        detection. Click <b>enable webcam</b> below and grant access to the
        webcam if prompted.
      </p>
      <div id="liveView" className="videoView">
        <button
          id="webcamButton"
          className="mdc-button mdc-button--raised"
          onClick={handleEnableWebcam}
        >
          <span className="mdc-button__ripple"></span>
          <span className="mdc-button__label">
            {webcamRunning ? 'DISABLE WEBCAM' : 'ENABLE WEBCAM'}
          </span>
        </button>
        <div style={{ position: 'relative' }}>
          <video
            id="webcam"
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
            id="output_canvas"
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
      </div>
    </section>
  );
};

export default PoseEstimator;
