import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';
import { Button } from 'primereact/button';
import React, { useEffect, useRef, useState } from 'react';

// const landmarksToRemove = [
//   0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 17, 18, 19, 20, 21, 22,
// ];
const landmarksToRemove = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const drawOptions = { color: 'white', lineWidth: 5, visibilityMin: 0.65 };
const defaultVideoSize = { width: 1280, height: 720 };

const boneImages = {
  humerus: new Image(),
  radius: new Image(),
  femur: new Image(),
  spine: new Image(),
};

boneImages.humerus.src = 'bone.png';
boneImages.radius.src = 'bone.png';
boneImages.femur.src = 'femur.png';
boneImages.spine.src = 'spine.png';

const PoseTrackerWithUpload = () => {
  const [poseLandmarker, setPoseLandmarker] = useState(null);
  const [webcamRunning, setWebcamRunning] = useState(false);
  const [imagePoseLandmarker, setImagePoseLandmarker] = useState(null);
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

  const handleEnableWebcam = async () => {
    if (!poseLandmarker) {
      // toast.error('PoseLandmarker not loaded yet.');
      return;
    }
    setWebcamRunning((prev) => !prev);
  };

  // useEffect(() => {
  //   if (!poseLandmarker) return;
  //   if (!webcamRunning) {
  //     setWebcamRunning((prev) => !prev);
  //   }
  // }, [poseLandmarker]);

  // const drawCallback = (results) => {
  //   if (!results.landmarks[0] || !canvasRef.current) return;
  //   const canvasCtx = canvasRef.current.getContext('2d');
  //   const { width, height } = videoSize;
  //   canvasCtx.save();
  //   canvasCtx.clearRect(0, 0, width, height);
  //   canvasCtx.fillStyle = 'white';
  //   // const landmarks = results.landmarks[0];

  //   PoseLandmarker.POSE_CONNECTIONS.forEach((connection) => {
  //     const { start, end } = connection;
  //     if (
  //       !landmarksToRemove.includes(start) &&
  //       !landmarksToRemove.includes(end)
  //     ) {
  //       const startLandmark = results.landmarks[0][start];
  //       const endLandmark = results.landmarks[0][end];
  //       if (
  //         startLandmark.visibility < drawOptions.visibilityMin ||
  //         endLandmark.visibility < drawOptions.visibilityMin
  //       ) {
  //         canvasCtx.restore();
  //         return;
  //       }
  //       const startX = startLandmark.x * width;
  //       const startY = startLandmark.y * height;
  //       const endX = endLandmark.x * width;
  //       const endY = endLandmark.y * height;

  //       // Draw connection line
  //       canvasCtx.globalCompositeOperation = 'destination-over';
  //       canvasCtx.lineWidth = drawOptions.lineWidth;
  //       canvasCtx.strokeStyle = drawOptions.color;
  //       // canvasCtx.setLineDash([4, 4]);
  //       canvasCtx.beginPath();
  //       canvasCtx.moveTo(startX, startY);
  //       canvasCtx.lineTo(endX, endY);
  //       canvasCtx.stroke();

  //       // Draw endpoints
  //       canvasCtx.globalCompositeOperation = 'source-over';
  //       canvasCtx.fillStyle =
  //         start % 2 === 0 ? 'rgb(0,217,231)' : 'rgb(255,138,0)';
  //       canvasCtx.beginPath();
  //       canvasCtx.arc(
  //         startX,
  //         startY,
  //         drawOptions.lineWidth + 2,
  //         0,
  //         2 * Math.PI
  //       );
  //       canvasCtx.arc(endX, endY, drawOptions.lineWidth + 2, 0, 2 * Math.PI);
  //       canvasCtx.fill();
  //     }
  //   });

  //   canvasCtx.restore();
  // };

  const drawBoneImage = (ctx, img, x1, y1, x2, y2, thickness = 16) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const angle = Math.atan2(dy, dx);
    const length = Math.sqrt(dx * dx + dy * dy);

    ctx.save();
    ctx.translate(x1, y1);
    ctx.rotate(angle);
    ctx.drawImage(img, 0, -thickness / 2, length, thickness);
    ctx.restore();
  };

  // const drawSpineImage = (ctx, img, landmarks, spineWidth = 30) => {
  //   const { width: W, height: H } = videoSize;

  //   const leftShoulder = landmarks[11];
  //   const rightShoulder = landmarks[12];
  //   const leftHip = landmarks[23];
  //   const rightHip = landmarks[24];

  //   if (
  //     leftShoulder.visibility < drawOptions.visibilityMin ||
  //     rightShoulder.visibility < drawOptions.visibilityMin ||
  //     leftHip.visibility < drawOptions.visibilityMin ||
  //     rightHip.visibility < drawOptions.visibilityMin
  //   )
  //     return;

  //   // Midpoints
  //   const topX = ((leftShoulder.x + rightShoulder.x) / 2) * W;
  //   const topY = ((leftShoulder.y + rightShoulder.y) / 2) * H;
  //   const bottomX = ((leftHip.x + rightHip.x) / 2) * W;
  //   const bottomY = ((leftHip.y + rightHip.y) / 2) * H;

  //   // Rotation and drawing
  //   const dx = bottomX - topX;
  //   const dy = bottomY - topY;
  //   const angle = Math.atan2(dy, dx);
  //   const length = Math.sqrt(dx * dx + dy * dy);

  //   ctx.save();
  //   ctx.translate(topX, topY);
  //   ctx.rotate(angle);
  //   ctx.drawImage(img, 0, -spineWidth / 2, length, spineWidth);
  //   // ctx.drawImage(img, -spineWidth / 2, 0, spineWidth, length);
  //   ctx.restore();
  // };

  const drawSpineImage = (ctx, img, landmarks, spineWidth = 30) => {
    const { width: W, height: H } = videoSize;

    const leftShoulder = landmarks[11];
    const rightShoulder = landmarks[12];
    const leftHip = landmarks[23];
    const rightHip = landmarks[24];

    if (
      leftShoulder.visibility < drawOptions.visibilityMin ||
      rightShoulder.visibility < drawOptions.visibilityMin ||
      leftHip.visibility < drawOptions.visibilityMin ||
      rightHip.visibility < drawOptions.visibilityMin
    )
      return;

    // Midpoints of shoulders and hips
    const topX = ((leftShoulder.x + rightShoulder.x) / 2) * W;
    const topY = ((leftShoulder.y + rightShoulder.y) / 2) * H;
    const bottomX = ((leftHip.x + rightHip.x) / 2) * W;
    const bottomY = ((leftHip.y + rightHip.y) / 2) * H;

    const dx = bottomX - topX;
    const dy = bottomY - topY;
    // const angle = Math.atan2(dy, dx); // angle spine should follow
    const length = Math.sqrt(dx * dx + dy * dy); // length of spine image on canvas

    // 🧠 Image is vertical, so we want to draw it upright, stretching height = length
    ctx.save();
    ctx.translate(topX, topY);
    ctx.rotate(0); // rotate spine to align top → bottom
    ctx.drawImage(img, -spineWidth / 2, 0, spineWidth, length);
    ctx.restore();
  };

  const drawSpineLine = (ctx, landmarks, width, color) => {
    const ls = landmarks[11];
    const rs = landmarks[12];
    const lh = landmarks[23];
    const rh = landmarks[24];

    if ([ls, rs, lh, rh].some((l) => l.visibility < 0.75)) return;

    const { width: W, height: H } = videoSize;

    const midTopX = ((ls.x + rs.x) / 2) * W;
    const midTopY = ((ls.y + rs.y) / 2) * H;
    const midBottomX = ((lh.x + rh.x) / 2) * W;
    const midBottomY = ((lh.y + rh.y) / 2) * H;

    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.moveTo(midTopX, midTopY);
    ctx.lineTo(midBottomX, midBottomY);
    ctx.stroke();
  };

  const customBoneMap = [
    { joints: [11, 13], width: 18, color: '#FFFFFF' }, // Left humerus
    { joints: [13, 15], width: 12, color: '#CCCCCC' }, // Left radius
    { joints: [12, 14], width: 18, color: '#FFFFFF' }, // Right humerus
    { joints: [14, 16], width: 12, color: '#CCCCCC' }, // Right radius
    { joints: [23, 25], width: 20, color: '#EEEEEE' }, // Left femur
    { joints: [25, 27], width: 14, color: '#AAAAAA' }, // Left tibia
    { joints: [24, 26], width: 20, color: '#EEEEEE' }, // Right femur
    { joints: [26, 28], width: 14, color: '#AAAAAA' }, // Right tibia
    { joints: [11, 12], width: 10, color: '#999999' }, // Clavicle
    { joints: [23, 24], width: 22, color: '#DDDDDD' }, // Pelvis
    { joints: [11, 23], width: 16, color: '#FFFFFF' }, // Left torso
    { joints: [12, 24], width: 16, color: '#FFFFFF' }, // Right torso
  ];

  const drawCapsuleBone = (ctx, x1, y1, x2, y2, width, color) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);
    const radius = width / 2;

    ctx.save();
    ctx.translate(x1, y1);
    ctx.rotate(angle);

    ctx.beginPath();
    ctx.moveTo(0, -radius);
    ctx.lineTo(length, -radius);
    ctx.arc(length, 0, radius, -Math.PI / 2, Math.PI / 2);
    ctx.lineTo(0, radius);
    ctx.arc(0, 0, radius, Math.PI / 2, -Math.PI / 2);
    ctx.closePath();

    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
  };

  const drawSpineBone = (ctx, landmarks, width = 18, color = '#FFFFFF') => {
    const { width: W, height: H } = videoSize;

    const topX = ((landmarks[11].x + landmarks[12].x) / 2) * W;
    const topY = ((landmarks[11].y + landmarks[12].y) / 2) * H;
    const bottomX = ((landmarks[23].x + landmarks[24].x) / 2) * W;
    const bottomY = ((landmarks[23].y + landmarks[24].y) / 2) * H;

    drawCapsuleBone(ctx, topX, topY, bottomX, bottomY, width, color);
  };

  const drawCallback = (results) => {
    if (!results.landmarks[0] || !canvasRef.current) return;

    const ctx = canvasRef.current.getContext('2d');
    const { width, height } = videoSize;
    ctx.clearRect(0, 0, width, height);
    const landmarks = results.landmarks[0];

    // Custom bone connection map
    const customBones = [
      { points: [11, 13], bone: 'radius' }, // Left upper arm
      { points: [13, 15], bone: 'radius' }, // Left lower arm
      { points: [12, 14], bone: 'radius' }, // Right upper arm
      { points: [14, 16], bone: 'radius' }, // Right lower arm
      { points: [23, 25], bone: 'radius' }, // Left upper leg
      { points: [25, 27], bone: 'radius' }, // Left lower leg (for demo)
      { points: [24, 26], bone: 'radius' }, // Right upper leg
      { points: [26, 28], bone: 'radius' }, // Right lower leg (for demo)
      { points: [11, 12], bone: 'humerus' }, // Shoulder spine
      { points: [23, 24], bone: 'humerus' }, // Hip spine
      // { points: [11, 23], bone: 'femur' }, // Left torso
      // { points: [12, 24], bone: 'femur' }, // Right torso
    ];

    customBones.forEach(({ points: [startIdx, endIdx], bone }) => {
      const start = landmarks[startIdx];
      const end = landmarks[endIdx];

      if (
        start.visibility < drawOptions.visibilityMin ||
        end.visibility < drawOptions.visibilityMin
      )
        return;

      const x1 = start.x * width;
      const y1 = start.y * height;
      const x2 = end.x * width;
      const y2 = end.y * height;

      drawBoneImage(ctx, boneImages[bone], x1, y1, x2, y2, 80);
      drawSpineImage(ctx, boneImages.spine, landmarks, 120);
    });

    //   // Optionally draw spine center line:
    //   // drawSpineLine(ctx, landmarks, 6, 'white');
  };

  const predictWebcam = async () => {
    if (!poseLandmarker || !webcamRunning) return;

    const video = videoRef.current;

    const detectFrame = async () => {
      if (!video.videoWidth || !video.videoHeight) {
        if (animationFrameId.current) {
          cancelAnimationFrame(animationFrameId.current);
          animationFrameId.current = null;
        }
        return;
      }
      // ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const startTimeMs = performance.now();
      if (videoRef.current.readyState < 2) {
        console.error('Video not ready for processing.');
        return;
      }
      try {
        await poseLandmarker.detectForVideo(
          videoRef.current,
          startTimeMs,
          drawCallback
        );
      } catch (error) {
        console.log('PoseLandmarker Error:', error);
        return;
      }
      if (webcamRunning) {
        animationFrameId.current = requestAnimationFrame(detectFrame);
      }
    };

    detectFrame();
  };

  const runStream = async () => {
    const constraints = {
      video: {
        deviceId: 'test',
        width: { ideal: videoSize.width, max: videoSize.width },
        height: { ideal: videoSize.height, max: videoSize.height },
        frameRate: { ideal: 10, max: 15 },
      },
      audio: false,
    };

    const video = videoRef.current;

    if (webcamRunning) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (video) {
          video.srcObject = stream;
          video.addEventListener('loadeddata', predictWebcam);
        }
      } catch (err) {
        console.error('Error accessing webcam:', err);
      }
    } else {
      if (!video || !video.srcObject) return;

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
              objectFit: 'cover',
              zIndex: 1,
            }}
          />
          <canvas
            ref={canvasRef}
            width={videoSize.width}
            height={videoSize.height}
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

      {/* Control Button */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <Button
          label="Toggle Webcam"
          icon="pi pi-video"
          style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}
          className="p-button-success"
          onClick={handleEnableWebcam}
        />
      </div>
    </div>
  );
};

export default PoseTrackerWithUpload;
