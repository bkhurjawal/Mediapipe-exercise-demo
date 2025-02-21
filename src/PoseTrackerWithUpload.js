import {
  FilesetResolver,
  PoseLandmarker,
  HandLandmarker,
} from '@mediapipe/tasks-vision';
import { DrawingUtils } from 'https://unpkg.com/@mediapipe/tasks-vision@0.10.21-rc.20250110/vision_bundle.mjs';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import React, { useEffect, useRef, useState } from 'react';
import { Messages } from './Messages';
import {
  calculateCombinedWristAngle,
  calculateLumbarExtension,
  calculateLumbarFlexion,
  calculateLumbarLateral,
  calculateLumbarLateralFlexion,
  calculateLumbarRotation,
  calculateNeckExtension,
  calculateNeckFlexion,
  calculateNeckLateralBending,
  calculateNeckRotation,
  calculatePronation,
  calculateRadialDeviation,
  calculateRadialUlnar,
  calculateSupination,
  calculateUlnarDeviation,
  calculateWristExtension,
  calculateWristFlexion,
  calculateWristFlexionExtension,
  calculateWristPronationSupination,
  skeletonColors,
} from './helpers';

const jointRadius = 5;
const lineWidth = 5;

const PoseTrackerWithUpload = () => {
  const [poseLandmarker, setPoseLandmarker] = useState(null);
  const [handLandmarker, setHandLandmarker] = useState(null);
  const [webcamRunning, setWebcamRunning] = useState(false);
  const [insideFrame, setInsideFrame] = useState(false);
  const [toastActive, setToastActive] = useState(false);
  const [imagePoseLandmarker, setImagePoseLandmarker] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null); // New state for uploaded image
  const [message, setMessage] = useState(Messages.GET_BACK);
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState('top');
  const [lumbarRotation, setLumbarRotation] = useState('');
  const [pronation, setPronation] = useState('');
  const [supinion, setSupinion] = useState('');
  const [ulnar, setUlnar] = useState('');
  const [radial, setRadial] = useState('');
  const [lateral, setLateral] = useState('');
  const [handAngles, setHandAngles] = useState('');
  const [hasEnteredFrame, setHasEnteredFrame] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const toast = useRef(null);
  const animationFrameId = useRef(null); // Track the animation frame ID
  const imageCanvasRef = useRef(null); // New ref for image canvas

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
            'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_heavy/float16/latest/pose_landmarker_heavy.task',
          // modelAssetPath:
          //   'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
          delegate: 'GPU',
        },
        runningMode: 'VIDEO',
        numPoses: 1,
        minPoseDetectionConfidence: 0.6,
        minTrackingConfidence: 0.6,
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
      setPoseLandmarker(landmarker);
      setHandLandmarker(handLandmarker);
    };
    loadPoseLandmarker();
  }, []);
  // ✅ Load Mediapipe Pose Detector for image
  useEffect(() => {
    const loadImagePoseLandmarker = async () => {
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.0/wasm'
      );
      const landmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task',
          delegate: 'GPU',
        },
        runningMode: 'IMAGE',
        numPoses: 1,
        minPoseDetectionConfidence: 0.6,
        minTrackingConfidence: 0.6,
      });
      setImagePoseLandmarker(landmarker);
    };
    loadImagePoseLandmarker();
  }, []);

  const drawTextWithBackground = (
    ctx,
    text,
    x,
    y,
    textColor = 'white',
    bgColor = 'black'
  ) => {
    return;
    ctx.font = '20px Arial'; // Set the font
    const textWidth = ctx.measureText(text).width; // Measure text width
    const padding = 5; // Padding around the text

    // Draw the background rectangle
    ctx.fillStyle = bgColor;
    ctx.fillRect(x - padding, y - 20, textWidth + padding * 2, 25);

    // Draw the text on top
    ctx.fillStyle = textColor;
    ctx.fillText(text, x, y);
  };

  const calculateAngles = (landmarks, ctx) => {
    if (!landmarks || !ctx) return;
    const leftEar = landmarks[7];
    const leftShoulder = landmarks[11];
    const nose = landmarks[0];
    const leftHip = landmarks[23];
    const leftKnee = landmarks[25];
    const rightElbow = landmarks[14];
    const rightWrist = landmarks[16];
    const rightIndex = landmarks[21];
    const rightHip = landmarks[24];
    const rightShoulder = landmarks[12];

    const leftElbow = landmarks[14];
    const leftWrist = landmarks[16];
    const indexFinger = landmarks[19];
    const pinkyFinger = landmarks[18];
    const midShoulder = {
      x: (leftShoulder.x + rightShoulder.x) / 2,
      y: (leftShoulder.y + rightShoulder.y) / 2,
    };
    const midHip = {
      x: (leftHip.x + rightHip.x) / 2,
      y: (leftHip.y + rightHip.y) / 2,
    };

    // Neck Flexion
    if (leftEar && leftShoulder && nose) {
      const neckFlexion = calculateNeckFlexion(leftEar, leftShoulder, nose);
      drawTextWithBackground(ctx, `Neck Flexion: ${neckFlexion}°`, 10, 40);
    }

    // Neck Extension
    if (leftEar && leftShoulder && nose) {
      const neckExtension = calculateNeckExtension(leftEar, leftShoulder, nose);
      drawTextWithBackground(ctx, `Neck Extension: ${neckExtension}°`, 10, 60);
    }

    // Lumbar Flexion
    if (leftHip && leftShoulder && leftKnee) {
      const lumbarFlexion = calculateLumbarFlexion(
        leftHip,
        leftShoulder,
        leftKnee
      );

      drawTextWithBackground(ctx, `Lumbar Flexion: ${lumbarFlexion}°`, 10, 80);
    }
    // Wrist Flexion
    if (rightElbow && rightWrist && rightIndex) {
      const wristFlexion = calculateWristFlexion(
        rightElbow,
        rightWrist,
        rightIndex
      );

      drawTextWithBackground(ctx, `Wrist Flexion: ${wristFlexion}°`, 10, 120);
    }

    // Wrist Extension
    if (rightElbow && rightWrist && rightIndex) {
      const wristExtension = calculateWristExtension(
        rightElbow,
        rightWrist,
        rightIndex
      );

      drawTextWithBackground(
        ctx,
        `Wrist Extension: ${wristExtension}°`,
        10,
        140
      );
    }

    // Lumbar Extension
    if (leftHip && leftShoulder && leftKnee) {
      const lumbarExtension = calculateLumbarExtension(
        leftHip,
        leftShoulder,
        leftKnee
      );

      drawTextWithBackground(
        ctx,
        `Lumbar Extension: ${lumbarExtension}°`,
        10,
        100
      );
    }
    // Lumbar Lateral Flexion

    if (nose && leftShoulder && rightShoulder) {
      const neckLateralBend = calculateNeckLateralBending(
        nose,
        leftShoulder,
        rightShoulder
      );
      const neckRotation = calculateNeckRotation(
        nose,
        leftShoulder,
        rightShoulder
      );

      // Determine bending direction
      const direction =
        nose.x < leftShoulder.x
          ? 'Left'
          : nose.x > rightShoulder.x
          ? 'Right'
          : 'Center';

      drawTextWithBackground(
        ctx,
        `Neck Lateral Bending (${direction}): ${neckLateralBend}°`,
        10,
        180
      );
      drawTextWithBackground(
        ctx,
        `Neck Rotation (${direction}): ${neckRotation}°`,
        10,
        200
      );
    }

    // Ulnar Deviation
    if (indexFinger && pinkyFinger && leftWrist) {
      const ulnarDeviation = calculateUlnarDeviation(
        indexFinger,
        pinkyFinger,
        leftWrist
      );
      drawTextWithBackground(
        ctx,
        `Ulnar Deviation: ${ulnarDeviation}°`,
        10,
        220
      );
    }

    // Radial Deviation
    if (indexFinger && pinkyFinger && leftWrist) {
      const radialDeviation = calculateRadialDeviation(
        indexFinger,
        pinkyFinger,
        leftWrist
      );
      drawTextWithBackground(
        ctx,
        `Radial Deviation: ${radialDeviation}°`,
        10,
        240
      );
    }

    // Pronation
    if (leftElbow && leftWrist && indexFinger) {
      const pronation = calculatePronation(leftElbow, leftWrist, indexFinger);
      drawTextWithBackground(ctx, `Pronation: ${pronation}°`, 10, 260);
    }

    // Supination
    if (leftElbow && leftWrist && indexFinger) {
      const supination = calculateSupination(leftElbow, leftWrist, indexFinger);
      drawTextWithBackground(ctx, `Supination: ${supination}°`, 10, 280);
    }

    if (nose && leftHip && rightHip && leftShoulder) {
      // const lateralFlexion = calculateLumbarLateralFlexion(
      //   nose,
      //   midShoulder,
      //   midHip
      // );
      const lateralFlexion = calculateLumbarLateral(
        nose,
        leftHip,
        rightHip,
        leftShoulder
      );
      // setLateral(`Lumbar Lateral : ${lateralFlexion}°`);
      drawTextWithBackground(
        ctx,
        `Lumbar Lateral : ${lateralFlexion}°`,
        10,
        160
      );
    }

    // Lumbar Rotation
    if (leftShoulder && rightShoulder && leftHip && rightHip) {
      const lumbarRotationExercise = calculateLumbarRotation(
        leftShoulder,
        rightShoulder,
        leftHip,
        rightHip
      );
      console.log('lumbarRotation', lumbarRotationExercise);
      // setLumbarRotation(`Lumbar Rotation: ${lumbarRotationExercise}°`);
      // const direction =
      //   nose.x < leftHip.x ? 'Left' : nose.x > rightHip.x ? 'Right' : 'Center';
      // drawTextWithBackground(
      //   ctx,
      //   `Lumbar Rotation (${direction}): ${lumbarRotation}°`,
      //   10,
      //   300
      // );
    }
  };

  // ✅ Process Image and Detect Pose
  const processImage = async (imageSrc) => {
    if (!imagePoseLandmarker) return;

    const image = new Image();
    image.src = imageSrc;
    image.onload = async () => {
      const canvas = imageCanvasRef.current;
      const ctx = canvas.getContext('2d');
      canvas.width = image.width;
      canvas.height = image.height;
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

      const results = await imagePoseLandmarker.detect(image);
      if (results?.landmarks.length > 0) {
        const landmarks = results.landmarks[0];
        const drawingUtils = new DrawingUtils(ctx);

        calculateAngles(landmarks, ctx);

        drawingUtils.drawConnectors(
          landmarks,
          PoseLandmarker.POSE_CONNECTIONS,
          {
            color: skeletonColors.left_shoulder_hand,
            lineWidth: lineWidth,
          }
        );

        landmarks.forEach((landmark, index) => {
          const landmarkName = Object.keys(skeletonColors)[index];
          const color = skeletonColors[landmarkName] || 'rgb(255, 255, 255)';
          drawingUtils.drawLandmarks([landmark], {
            radius: jointRadius,
            color: color,
          });
        });
      }
    };
  };

  // ✅ Handle Image Upload
  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target.result);
        processImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // ✅ Handle Webcam Toggle
  const handleEnableWebcam = async () => {
    if (!poseLandmarker) {
      // toast.error('PoseLandmarker not loaded yet.');
      return;
    }
    setWebcamRunning((prev) => !prev);
  };

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

  const predictWebcam = async () => {
    if (!poseLandmarker || !webcamRunning) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const drawingUtils = new DrawingUtils(ctx);

    const detectFrame = async () => {
      if (!video.videoWidth || !video.videoHeight) {
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
      const handResults = await handLandmarker.detectForVideo(
        video,
        performance.now()
      );

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (
        results?.landmarks.length > 0 &&
        handResults?.landmarks &&
        handResults.landmarks.length > 0
      ) {
        const poseLandmarks = results.landmarks[0];
        // userInside = isWithinFrame(landmarks);

        // If the user enters the frame for the first time, update the state
        // if (userInside && !hasEnteredFrame) {
        //   setHasEnteredFrame(true);
        // }
        // const poseConnectionsArray = Object.values(
        //   PoseLandmarker.POSE_CONNECTIONS
        // );
        // const filteredPoseConnections = poseConnectionsArray.filter(
        //   ([start, end]) => {
        //     const skipStart =
        //       (start >= 1 && start <= 10) || (start >= 16 && start <= 22);
        //     const skipEnd = (end >= 1 && end <= 10) || (end >= 16 && end <= 22);
        //     return !(skipStart || skipEnd);
        //   }
        // );

        // Filter out face landmarks (indices 0 to 10)
        const filteredPoseLandmarks = poseLandmarks.filter(
          (_, index) => index > 10
        );

        //  Convert POSE_CONNECTIONS object to an array of connections
        // const poseConnectionsArray = Object.values(
        //   PoseLandmarker.POSE_CONNECTIONS
        // );

        const poseConnectionsArray = [];
        for (const key in PoseLandmarker.POSE_CONNECTIONS) {
          if (Object.hasOwn(PoseLandmarker.POSE_CONNECTIONS, key)) {
            const connection = PoseLandmarker.POSE_CONNECTIONS[key];
            // If connection is already an array, use it; if not, assume it has .start and .end
            if (Array.isArray(connection)) {
              poseConnectionsArray.push(connection);
            } else if (
              connection.start !== undefined &&
              connection.end !== undefined
            ) {
              poseConnectionsArray.push([connection.start, connection.end]);
            }
          }
        }

        // Filter pose connections to exclude connections involving face landmarks
        const filteredPoseConnections = poseConnectionsArray.filter(
          ([start, end]) => start > 10 && end > 10
        );
        // drawingUtils.drawConnectors(
        //   filteredPoseLandmarks,
        //   filteredPoseConnections,
        //   {
        //     color: skeletonColors.left_shoulder_hand,
        //     lineWidth: lineWidth,
        //   }
        // );

        // drawingUtils.drawConnectors(
        //   poseLandmarks,
        //   PoseLandmarker.POSE_CONNECTIONS,
        //   {
        //     color: skeletonColors.left_shoulder_hand,
        //     lineWidth: lineWidth,
        //   }
        // );

        // poseLandmarks.forEach((landmark, index) => {
        //   const landmarkName = Object.keys(skeletonColors)[index];
        //   const color = skeletonColors[landmarkName] || 'rgb(255, 255, 255)';
        //   drawingUtils.drawLandmarks([landmark], {
        //     radius: jointRadius,
        //     color: color,
        //   });
        // });

        // Draw filtered pose landmarks
        // filteredPoseLandmarks.forEach((landmark, index) => {
        //   const landmarkName = Object.keys(skeletonColors)[index + 11]; // Adjust index for filtered landmarks
        //   const color = skeletonColors[landmarkName] || 'rgb(255, 255, 255)';
        //   drawingUtils.drawLandmarks([landmark], {
        //     radius: jointRadius,
        //     color: color,
        //   });
        // });
        const rightWristPose = poseLandmarks[16];
        const leftWristPose = poseLandmarks[15];

        const combinedAngles = [];

        handResults.landmarks.forEach((handLandmarks, i) => {
          const handWrist = handLandmarks[0];
          const distanceToRight = Math.abs(handWrist.x - rightWristPose.x);
          const distanceToLeft = Math.abs(handWrist.x - leftWristPose.x);
          let poseElbow, poseWrist;
          poseElbow = poseLandmarks[13];
          poseWrist = poseLandmarks[15];

          if (distanceToRight < distanceToLeft) {
            // Right hand.
            poseElbow = poseLandmarks[14];
            poseWrist = poseLandmarks[16];
          } else {
            // Left hand.
            poseElbow = poseLandmarks[13];
            poseWrist = poseLandmarks[15];
          }

          const handIndexTip = handLandmarks[8];
          const handPinkyTip = handLandmarks[20];
          const angle = calculateCombinedWristAngle(
            poseElbow,
            poseWrist,
            handIndexTip
          );

          const flex = angle > 0 ? angle : 0;
          const ext = angle < 0 ? Math.abs(angle) : 0;
          combinedAngles.push({ flex, ext, handIndex: i });
          const wrist = poseLandmarks[16]; // adjust the index as needed
          const middleFingertip = handLandmarks[12]; // example index for middle fingertip
          const thumbTip = handLandmarks[4]; // example index for thumb tip
          const wristProSup = calculateWristPronationSupination(
            wrist,
            thumbTip
          );
          const wristRadialUlnar = calculateRadialUlnar(wrist, middleFingertip);
          const ulnarDeviation =
            wristRadialUlnar < 0 ? Math.abs(wristRadialUlnar) : 0;
          const radialDeviation = wristRadialUlnar > 0 ? wristRadialUlnar : 0;
          const supination = wristProSup < 0 ? Math.abs(wristProSup) : 0;
          const pronation = wristProSup > 0 ? wristProSup : 0;
          setPronation(`Wrist Pronation: ${pronation}°`);
          setSupinion(`Wrist Supination: ${supination}°`);
          setUlnar(`Wrist Ulnar: ${ulnarDeviation}°`);
          setRadial(`Wrist Radial: ${radialDeviation}°`);

          //  setWristUlnar(`Wrist Ulnar/Radial: ${wristRadialUlnar}°`);

          drawingUtils.drawConnectors(
            handLandmarks,
            HandLandmarker.HAND_CONNECTIONS,
            {
              color: 'white',
              // color: '"#FF0000',
              lineWidth: jointRadius,
            }
          );
          handLandmarks.forEach((landmark, index) => {
            drawingUtils.drawLandmarks([landmark], {
              radius: jointRadius,
              color: 'red',
            });
          });
        });

        // Display the combined wrist angles on the canvas.
        combinedAngles.forEach((angleData, i) => {
          setHandAngles(
            `Flexion: ${angleData.flex.toFixed(
              1
            )}°\nExtension: ${angleData.ext.toFixed(1)}°`
          );
        });

        calculateAngles(poseLandmarks, ctx);
      }

      // Only draw the red frame if the user has NOT entered before
      // if (!userInside && !hasEnteredFrame) {
      //   ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
      //   ctx.fillRect(0, 0, canvas.width, canvas.height);

      //   ctx.globalCompositeOperation = 'destination-out';
      //   ctx.fillStyle = 'rgba(0, 0, 0, 1)';
      //   ctx.beginPath();
      //   ctx.roundRect(frameLeft, frameTop, frameWidth, frameHeight, 15);
      //   ctx.fill();
      //   ctx.globalCompositeOperation = 'source-over';

      //   ctx.strokeStyle = 'red';
      //   ctx.lineWidth = 5;
      //   ctx.beginPath();
      //   ctx.roundRect(frameLeft, frameTop, frameWidth, frameHeight, 15);
      //   ctx.stroke();
      // }

      if (webcamRunning) {
        animationFrameId.current = requestAnimationFrame(detectFrame);
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
    <div>
      {/* Webcam Section */}
      <div
        style={{ minHeight: '80vh' }}
        className="flex flex-col justify-center items-center  bg-black text-white  p-2"
      >
        <div className="w-full  flex flex-col items-center">
          <div className="relative w-full max-w-lg  bg-gray-900 flex justify-center items-center rounded-xl overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="absolute w-full h-full object-cover"
            />
            <canvas
              ref={canvasRef}
              width="1280"
              height="720"
              className="absolute w-full h-full"
            />
          </div>
        </div>

        {/* Image Upload Section */}
        <div className="w-full flex  items-center">
          <div className="p-5">
            {/* <h1 style={{ color: 'black' }}>{lumbarRotation}</h1> */}
            {/* <h1 style={{ color: 'black' }}>{handAngles}</h1> */}
            {/* <h1 style={{ color: 'black' }}>{pronation}</h1>
            <h1 style={{ color: 'black' }}>{supinion}</h1> */}
            <h1 style={{ color: 'black' }}>{radial}</h1>
            <h1 style={{ color: 'black' }}>{ulnar}</h1>
          </div>
          {/* <h2 className="text-xl font-semibold mb-3">Upload an Image</h2> */}
          {/* <div className="relative w-full max-w-lg  bg-gray-900 flex justify-center items-center rounded-xl overflow-hidden">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="absolute opacity-0 w-full h-full cursor-pointer"
              id="image-upload"
            />
            <canvas
              ref={imageCanvasRef}
              width="1280"
              height="720"
              className="absolute w-full h-full"
            />
            <label
              htmlFor="image-upload"
              className="absolute text-white bg-gray-800 px-4 py-2 rounded-lg cursor-pointer"
              style={{ position: 'absolute', right: 0 }}
              // className="absolute top-2 right-2 text-white bg-gray-800 px-4 py-2 rounded-lg cursor-pointer"
            >
              Choose Image
            </label>
          </div> */}
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex flex-col justify-center items-center ">
        <Button
          label="Toggle Webcam"
          icon="pi pi-video"
          className="p-button-success"
          onClick={handleEnableWebcam}
        />
        {/* <Button
          label="Show Feedback"
          icon="pi pi-info-circle"
          className="p-button-primary"
          onClick={() => setVisible(true)}
        /> */}
      </div>

      {/* Feedback Dialog */}
      <Dialog
        visible={visible}
        position="top"
        style={{ width: '30vw' }}
        className="text-white"
        onHide={() => setVisible(false)}
        draggable={false}
        resizable={false}
      >
        <div className="flex flex-col px-6 py-4 gap-4 text-center bg-green-600 bg-opacity-50 rounded-lg">
          <p className="text-lg font-semibold">{message}</p>
        </div>
      </Dialog>
    </div>
  );
};

export default PoseTrackerWithUpload;
