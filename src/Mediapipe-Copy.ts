import {
  FilesetResolver,
  HandLandmarker,
  HandLandmarkerResult,
  NormalizedLandmark,
  PoseLandmarker,
  PoseLandmarkerResult,
} from '@mediapipe/tasks-vision';
import { useTypedSelector } from '@stores/index';
import { memo, useCallback, useEffect, useRef } from 'react';

const videoSize = {
  width: 1280,
  height: 720,
};
const drawOptions = { color: 'white', lineWidth: 5, visibilityMin: 0.65 };

const landmarksToRemove = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 17, 18, 19, 20, 21, 22,
];

let poseLandmarker: PoseLandmarker | null = null;
let handLandmarker: HandLandmarker | null = null;
let lastVideoTime = -1;
let animationFrameId: number;

function throttle<T extends (...args: any[]) => void>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  return function (...args: Parameters<T>): void {
    const now = performance.now();
    if (now - lastCall < delay) {
      return;
    }
    lastCall = now;
    func(...args);
  };
}

function Mediapipe(props: { cameraId: string | null }) {
  const { cameraId } = props;
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const { currentExercise } = useTypedSelector((state) => state.rom.main);

  const triggerResultsEvent = (eventName: string, data: unknown) => {
    const event = new CustomEvent(eventName, {
      bubbles: false,
      cancelable: true,
      detail: data,
    });
    window.dispatchEvent(event);
  };

  const throttledTriggerResultsEvent = throttle(triggerResultsEvent, 1000);

  const drawCallback = useCallback(
    (results: PoseLandmarkerResult) => {
      if (!results.landmarks[0] || !canvasRef?.current) return;

      const canvasCtx = canvasRef.current?.getContext(
        '2d'
      ) as CanvasRenderingContext2D;

      const width: number = videoSize.width;
      const height: number = videoSize.height;

      canvasCtx.save();
      canvasCtx.clearRect(0, 0, width, height);
      canvasCtx.fillStyle = 'white';

      // results.landmarks[0]?.forEach((landmark, index) => {
      // 	if (!landmarksToRemove.includes(index)) {
      // 		const smoothed = smoothedLandmarks[index];
      // 		smoothedLandmarks[index] = {
      // 			x: (
      // 				smoothed.x * (1 - SMOOTHING_FACTOR) +
      // 				landmark.x * SMOOTHING_FACTOR
      // 			).toFixed(2),
      // 			y: (
      // 				smoothed.y * (1 - SMOOTHING_FACTOR) +
      // 				landmark.y * SMOOTHING_FACTOR
      // 			).toFixed(2),
      // 			count: smoothed.count + 1,
      // 		};
      // 	}
      // });

      PoseLandmarker.POSE_CONNECTIONS.forEach((connection) => {
        const startLandmarkIndex = connection.start;
        const endLandmarkIndex = connection.end;

        if (
          !landmarksToRemove.includes(startLandmarkIndex) &&
          !landmarksToRemove.includes(endLandmarkIndex)
        ) {
          // const startSmoothed = smoothedLandmarks[startLandmarkIndex];
          // const endSmoothed = smoothedLandmarks[endLandmarkIndex];

          // const startX = +(startSmoothed.x * width).toFixed(2);
          // const startY = +(startSmoothed.y * height).toFixed(2);
          // const endX = +(endSmoothed.x * width).toFixed(2);
          // const endY = +(endSmoothed.y * height).toFixed(2);

          const start = results.landmarks[0][startLandmarkIndex];
          const end = results.landmarks[0][endLandmarkIndex];

          if (
            start.visibility < drawOptions.visibilityMin ||
            end.visibility < drawOptions.visibilityMin
          ) {
            canvasCtx.restore();
            return;
          }

          const startX = start.x * width;
          const startY = start.y * height;
          const endX = end.x * width;
          const endY = end.y * height;

          // Desenhar a linha suavizada
          canvasCtx.globalCompositeOperation = 'destination-over';
          canvasCtx.lineWidth = drawOptions.lineWidth;
          canvasCtx.strokeStyle = drawOptions.color;
          canvasCtx.beginPath();
          canvasCtx.moveTo(startX, startY);
          canvasCtx.lineTo(endX, endY);
          canvasCtx.stroke();

          // Desenhar pontos vermelhos nas interseções (início e fim da linha)
          canvasCtx.globalCompositeOperation = 'source-over';
          canvasCtx.fillStyle =
            startLandmarkIndex % 2 === 0 ? 'rgb(0,217,231)' : 'rgb(255,138,0)';
          canvasCtx.beginPath();
          canvasCtx.arc(
            startX,
            startY,
            drawOptions.lineWidth + 2,
            0,
            2 * Math.PI
          );
          canvasCtx.arc(endX, endY, drawOptions.lineWidth + 2, 0, 2 * Math.PI);
          canvasCtx.fill();
        }
      });

      throttledTriggerResultsEvent('results', {
        results: results.landmarks[0],
      });

      canvasCtx.restore();
    },
    [throttledTriggerResultsEvent]
  );

  const handDrawCallback = useCallback(
    (results: HandLandmarkerResult) => {
      if (
        results.landmarks &&
        results.handednesses &&
        results.landmarks.length > 0
      ) {
        let leftHand: NormalizedLandmark[] | null = null;
        let rightHand: NormalizedLandmark[] | null = null;

        results.landmarks.forEach((handLandmarks, index) => {
          const handedness =
            results.handednesses[index] &&
            results.handednesses[index][0] &&
            results.handednesses[index][0].categoryName;

          if (handLandmarks.length === 21) {
            if (handedness === 'Left') {
              leftHand = handLandmarks;
            } else if (handedness === 'Right') {
              rightHand = handLandmarks;
            }
          }
        });

        // Trigger a custom event that includes both left and right hand landmarks.
        throttledTriggerResultsEvent('handmarks', {
          handmarkLeft: leftHand,
          handmarkRight: rightHand,
        });
      }
      if (!results.landmarks || !canvasRef?.current) return;

      const canvasCtx = canvasRef.current.getContext('2d');
      if (!canvasCtx) return;

      const width = videoSize.width;
      const height = videoSize.height;

      // Optionally, do not clear the canvas here if you want to overlay on the pose drawing.
      // canvasCtx.clearRect(0, 0, width, height);

      results.landmarks.forEach((handLandmarks, index) => {
        // Check handedness info if available.
        // (Make sure your model options are set to output classification data.)

        const handedness =
          results?.handednesses && results?.handednesses[index]
            ? results?.handednesses[index][0]?.categoryName
            : 'Unknown';
        // Choose a color based on the hand type.
        const color =
          handedness === 'Left'
            ? 'rgb(255,138,0)'
            : handedness === 'Right'
            ? 'rgb(0,217,231)'
            : 'rgb(200,200,200)';

        handLandmarks.forEach((landmark) => {
          const x = landmark.x * width;
          const y = landmark.y * height;
          canvasCtx.beginPath();
          canvasCtx.arc(x, y, 5, 0, 2 * Math.PI);
          canvasCtx.fillStyle = color;
          canvasCtx.fill();
        });

        // If desired, draw hand connections (if a HAND_CONNECTIONS array is provided by the API)
        // Example (pseudo-code):
        HandLandmarker.HAND_CONNECTIONS.forEach((connection) => {
          const start = handLandmarks[connection.start];
          const end = handLandmarks[connection.end];
          canvasCtx.beginPath();
          canvasCtx.moveTo(start.x * width, start.y * height);
          canvasCtx.lineTo(end.x * width, end.y * height);
          canvasCtx.strokeStyle = 'white';
          canvasCtx.lineWidth = 5;
          canvasCtx.stroke();
        });
      });
    },
    [canvasRef]
  );

  // const predictWebcam = useCallback(() => {
  // 	// if (videoRef?.current && poseLandmarker) {
  // 	// 	const startTimeMs = performance.now();
  // 	// 	if (lastVideoTime !== videoRef?.current?.currentTime) {
  // 	// 		lastVideoTime = videoRef?.current?.currentTime || -1;
  // 	// 		poseLandmarker?.detectForVideo(
  // 	// 			videoRef?.current,
  // 	// 			startTimeMs,
  // 	// 			drawCallback,
  // 	// 		);
  // 	// 	}

  // 	// 	animationFrameId = requestAnimationFrame(predictWebcam);
  // 	// }

  // 	if (videoRef?.current) {
  // 		const startTimeMs = performance.now();

  // 		// Pose detection:
  // 		if (poseLandmarker) {
  // 			if (lastVideoTime !== videoRef.current.currentTime) {
  // 				lastVideoTime = videoRef.current.currentTime;
  // 				poseLandmarker.detectForVideo(
  // 					videoRef.current,
  // 					startTimeMs,
  // 					drawCallback,
  // 				);
  // 			}
  // 		}

  // 		// Hand detection:
  // 		if (handLandmarker) {
  // 			handLandmarker.detectForVideo(
  // 				videoRef.current,
  // 				startTimeMs,
  // 				handDrawCallback,
  // 			);
  // 		}

  // 		animationFrameId = requestAnimationFrame(predictWebcam);
  // 	}
  // }, [drawCallback]);

  const predictWebcam = useCallback(async () => {
    if (videoRef?.current) {
      const startTimeMs = performance.now();
      if (lastVideoTime !== videoRef.current.currentTime) {
        lastVideoTime = videoRef.current.currentTime || -1;
        const canvasCtx = canvasRef.current?.getContext('2d');
        if (canvasCtx) {
          canvasCtx.clearRect(0, 0, videoSize.width, videoSize.height);
        }
        if (poseLandmarker) {
          poseLandmarker.detectForVideo(
            videoRef.current,
            startTimeMs,
            drawCallback
          );
        }
        if (
          handLandmarker &&
          currentExercise?.name?.toLowerCase()?.includes('wrist')
        ) {
          try {
            const handResults = await handLandmarker.detectForVideo(
              videoRef.current,
              startTimeMs
            );
            handDrawCallback(handResults);
          } catch (err) {
            console.error('Error detecting hand landmarks:', err);
          }
        }
      }
      animationFrameId = requestAnimationFrame(predictWebcam);
    }
  }, [drawCallback, handDrawCallback]);

  const stopStreamedVideo = useCallback(() => {
    if (videoRef.current) {
      cancelAnimationFrame(animationFrameId);
      const stream = videoRef.current.srcObject as MediaStream;
      if (stream) {
        const tracks = stream.getTracks();

        tracks.forEach((track) => {
          track.stop();
        });
      }

      videoRef.current.srcObject = null;
      videoRef.current.removeEventListener('loadeddata', predictWebcam);
    }
  }, [predictWebcam]);

  const hasGetUserMedia = () => !!navigator.mediaDevices?.getUserMedia;

  const setupCamera = useCallback(() => {
    if (!hasGetUserMedia()) {
      console.warn('getUserMedia() is not supported by your browser');
      return;
    }

    if (!poseLandmarker) {
      console.warn('Wait! poseLandmaker not loaded yet.');
      setTimeout(setupCamera, 1000);
      return;
    }

    const constraints = {
      video: {
        deviceId: {
          exact: cameraId as string,
        },
        width: videoSize.width,
        height: videoSize.height,
        frameRate: {
          ideal: 15,
          max: 20,
        },
      },
      audio: false,
    };

    navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
      if (videoRef?.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.addEventListener('loadeddata', predictWebcam);
      }
    });
  }, [cameraId, predictWebcam]);

  const createPoseLandmarker = useCallback(async () => {
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
    );
    poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_full/float16/latest/pose_landmarker_full.task',
        delegate: 'CPU',
      },
      runningMode: 'VIDEO',
      numPoses: 1,
      minPoseDetectionConfidence: 0.6,
      minTrackingConfidence: 0.6,
    });
  }, []);

  const createHandLandmarker = useCallback(async () => {
    const vision = await FilesetResolver.forVisionTasks(
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
    );
    handLandmarker = await HandLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath:
          'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task',
      },
      runningMode: 'VIDEO',
      numHands: 2, // or 1 if you only want to detect one hand
      minHandDetectionConfidence: 0.6,
      minTrackingConfidence: 0.6,
    });
  }, []);

  useEffect(() => {
    createPoseLandmarker();
    createHandLandmarker();
    return () => {
      stopStreamedVideo();
    };
  }, [createPoseLandmarker, stopStreamedVideo]);

  useEffect(() => {
    if (cameraId) {
      stopStreamedVideo();
      setupCamera();
    }
  }, [cameraId, setupCamera, stopStreamedVideo]);

  return (
    <>
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
          zIndex: 1,
          objectFit: 'cover',
          aspectRatio: '16/9',
          width: '100%',
        }}
      />
      <canvas
        id="canvas"
        ref={canvasRef}
        width={videoSize.width}
        height={videoSize.height}
        style={{
          width: '100%',
          height: '100%',
          zIndex: 2,
          position: 'absolute',
          pointerEvents: 'none',
          top: 0,
          left: 0,
        }}
      />
    </>
  );
}
export default memo(Mediapipe);
