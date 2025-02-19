import {
  FilesetResolver,
  PoseLandmarker,
  HandLandmarker,
  FaceLandmarker,
} from '@mediapipe/tasks-vision';
import { DrawingUtils } from 'https://unpkg.com/@mediapipe/tasks-vision@0.10.21-rc.20250110/vision_bundle.mjs';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import React, { useEffect, useRef, useState } from 'react';

const jointRadius = 5;
const lineWidth = 5;

const PoseTrackerWithHolistic = () => {
  const [poseLandmarker, setPoseLandmarker] = useState(null);
  const [handLandmarker, setHandLandmarker] = useState(null);
  const [faceLandmarker, setFaceLandmarker] = useState(null);
  const [webcamRunning, setWebcamRunning] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const animationFrameId = useRef(null);

  useEffect(() => {
    const loadModels = async () => {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm'
      );

      const poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/1/pose_landmarker_full.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numPoses: 1,
      });

      const handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numHands: 2,
      });

      const faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
      });

      setPoseLandmarker(poseLandmarker);
      setHandLandmarker(handLandmarker);
      setFaceLandmarker(faceLandmarker);
    };

    loadModels();
  }, []);

  const runStream = async () => {
    const video = videoRef.current;
    if (webcamRunning) {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (!video) return;
      video.srcObject = stream;
      video.addEventListener('loadeddata', () => predictWebcam());
    } else {
      if (!video.srcObject) return;
      const tracks = video.srcObject?.getTracks();
      tracks?.forEach((track) => track.stop());
      video.srcObject = null;
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
        animationFrameId.current = null;
      }
    }
  };

  useEffect(() => {
    if (webcamRunning) {
      runStream();
    }
  }, [webcamRunning]);

  const predictWebcam = async () => {
    if (!poseLandmarker || !handLandmarker || !faceLandmarker || !webcamRunning)
      return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const drawingUtils = new DrawingUtils(ctx);

    const detectFrame = async () => {
      if (!video.videoWidth || !video.videoHeight) {
        cancelAnimationFrame(animationFrameId.current);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const poseResults = await poseLandmarker.detectForVideo(
        video,
        performance.now()
      );
      if (poseResults?.landmarks && poseResults.landmarks.length > 0) {
        // ✅ Added null check
        drawingUtils.drawConnectors(
          poseResults.landmarks[0],
          PoseLandmarker.POSE_CONNECTIONS,
          { color: 'limegreen', lineWidth: lineWidth }
        );
      }

      const handResults = await handLandmarker.detectForVideo(
        video,
        performance.now()
      );
      if (handResults?.landmarks && handResults.landmarks.length > 0) {
        // ✅ Added null check
        handResults.landmarks.forEach((landmarks) => {
          drawingUtils.drawConnectors(
            landmarks,
            HandLandmarker.HAND_CONNECTIONS,
            {
              // color: 'white',
              color: '"#FF0000',
              lineWidth: 5,
            }
          );
        });
      }

      const faceResults = await faceLandmarker.detectForVideo(
        video,
        performance.now()
      );
      if (faceResults?.landmarks && faceResults.landmarks.length > 0) {
        // ✅ Added null check
        drawingUtils.drawConnectors(
          faceResults.landmarks,
          FaceLandmarker.FACE_CONNECTIONS,
          {
            color: 'yellow',
            lineWidth: 1,
          }
        );
      }

      if (webcamRunning) {
        animationFrameId.current = requestAnimationFrame(detectFrame);
      }
    };

    detectFrame();
  };

  return (
    <div>
      <div>
        <video
          width="1280"
          height="720"
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full"
        />
        <canvas
          ref={canvasRef}
          width="1280"
          height="720"
          className="absolute top-0 left-0 w-full h-full pointer-events-none"
        />
      </div>
      <Button
        label="Toggle Webcam"
        onClick={() => setWebcamRunning((prev) => !prev)}
      />
    </div>
  );
};

export default PoseTrackerWithHolistic;
