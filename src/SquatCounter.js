import React, { useEffect, useRef, useState } from 'react';

import {
  DrawingUtils,
  PoseLandmarker,
  FilesetResolver,
} from 'https://cdn.skypack.dev/@mediapipe/tasks-vision@0.10.0';

const SquatCounter = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const sampleVideoRef = useRef(null);
  const [squatCount, setSquatCount] = useState(0);
  const [isUserInFrame, setIsUserInFrame] = useState(false);
  const [poseLandmarker, setPoseLandmarker] = useState(null);
  const [webcamRunning, setWebcamRunning] = useState(false);

  useEffect(() => {
    const createPoseLandmarker = async () => {
      try {
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
      } catch (error) {
        console.error('Error creating PoseLandmarker:', error);
      }
    };

    createPoseLandmarker();
  }, []);

  const enableWebcam = async () => {
    if (!poseLandmarker) {
      console.log('Wait for PoseLandmarker to load first!');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (webcamRunning) {
      setWebcamRunning(false);
      video.srcObject.getTracks().forEach((track) => track.stop());
      return;
    }

    setWebcamRunning(true);
  };
  const runStream = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const constraints = {
      video: { width: 1280, height: 720 },
    };

    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = stream;

    video.addEventListener('loadeddata', () => {
      const canvasCtx = canvas.getContext('2d');
      const drawingUtils = new DrawingUtils(canvasCtx);

      const predictWebcam = async () => {
        if (!webcamRunning) return;

        const startTimeMs = performance.now();
        poseLandmarker.detectForVideo(video, startTimeMs, (result) => {
          canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

          if (result.landmarks) {
            setIsUserInFrame(true);
            result.landmarks.forEach((landmark) => {
              drawingUtils.drawLandmarks(landmark, {
                radius: (data) =>
                  DrawingUtils.lerp(data.from.z, -0.15, 0.1, 5, 1),
              });
              drawingUtils.drawConnectors(
                landmark,
                PoseLandmarker.POSE_CONNECTIONS
              );
            });

            countSquats(result.landmarks[0]); // Count squats using the first detected pose
          } else {
            setIsUserInFrame(false);
          }
        });

        requestAnimationFrame(predictWebcam);
      };

      predictWebcam();
    });
  };

  useEffect(() => {
    if (webcamRunning) {
      runStream();
    }
  }, [webcamRunning]);

  const countSquats = (landmarks) => {
    if (!landmarks) return;
    const leftHip = landmarks[23]; // MediaPipe landmark index for left hip
    const rightHip = landmarks[24]; // MediaPipe landmark index for right hip
    const leftKnee = landmarks[25]; // MediaPipe landmark index for left knee
    const rightKnee = landmarks[26]; // MediaPipe landmark index for right knee

    if (leftHip && rightHip && leftKnee && rightKnee) {
      const hipAvgY = (leftHip.y + rightHip.y) / 2;
      const kneeAvgY = (leftKnee.y + rightKnee.y) / 2;

      if (hipAvgY > kneeAvgY) {
        setSquatCount((prevCount) => prevCount + 1);
      }
    }
  };

  return (
    <div>
      <h1>Squat Counter: {squatCount}</h1>
      <div style={{ display: 'flex' }}>
        <div style={{ position: 'relative' }}>
          <video
            ref={videoRef}
            width="640"
            height="480"
            autoPlay
            playsInline
            // style={{ display: isUserInFrame ? 'block' : 'none' }}
          />
          <canvas
            ref={canvasRef}
            width="640"
            height="480"
            style={{ position: 'absolute', top: 0, left: 0 }}
          />
        </div>
        <video
          ref={sampleVideoRef}
          src="sample-squat.mp4"
          width="640"
          height="480"
          autoPlay
          loop
          muted
        />
      </div>
      <button onClick={enableWebcam}>
        {webcamRunning ? 'Stop Webcam' : 'Start Webcam'}
      </button>
    </div>
  );
};

export default SquatCounter;
