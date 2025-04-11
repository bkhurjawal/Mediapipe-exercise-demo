import Loading from '@atoms/APLoading';
import { NormalizedLandmark } from '@mediapipe/tasks-vision';
import { ICustomRomExercise } from '@stores/interfaces';
import usePrevious from '@utils/usePrevious.hook';
import { memo, useCallback, useEffect, useState } from 'react';
import { Content } from 'antd/lib/layout/layout';
import { Typography } from 'antd';
import { ETransitions, setPoseData, TTransitions } from '@stores/rom/main';
import Mediapipe from './mediapipe';
import Symetrograph from './Components/Symetrograph';
import { useTypedDispatch, useTypedSelector } from '@stores/index';
import results from '@stores/rom/results';
import result from 'antd/es/result';

const limit = 0.6;

const calculateWristflexExtension = () => (positions) => {
  const [poseElbow, poseWrist, handIndexTip] = positions;
  const ref = { x: 1, y: 0 };
  const v = handIndexTip
    ? { x: handIndexTip.x - poseWrist.x, y: handIndexTip.y - poseWrist.y }
    : { x: 0, y: 0 };
  const dot = ref.x * v.x + ref.y * v.y;
  const magRef = Math.sqrt(ref.x * ref.x + ref.y * ref.y);
  const magV = Math.sqrt(v.x * v.x + v.y * v.y);
  if (magV === 0) return 0;
  let angle = Math.acos(dot / (magRef * magV)) * (180 / Math.PI);
  const cross = ref.x * v.y - ref.y * v.x;
  if (cross < 0) angle = -angle;
  return angle;
};

interface IVideoPoseEstimatorProps {
  currentExercise: ICustomRomExercise | null;
  transition: TTransitions | null;
  cameraId: string | null;
  loading: boolean;
  onBodyPointsVisible: (param: boolean) => void;
  onExerciseValueAndCoordinates: (
    value: number,
    ccordinates: NormalizedLandmark[]
  ) => void;
  onLoading: () => void;
  onNextTransition: (param: TTransitions) => void;
  onShowIncorrectSide?: (param: boolean) => void;
  selfieMode?: boolean;
  isSwitchMode?: boolean;
  isFullscreen: boolean;
}

let latestPoseResults: NormalizedLandmark[] | null = null;
let latestHandResults: {
  handmarkLeft?: NormalizedLandmark[];
  handmarkRight?: NormalizedLandmark[];
} = {};

// Combined approach: uses pose wrist (and optionally elbow for consistency) and hand landmarks.

function calculateCombinedWristAngle(
  poseElbow: NormalizedLandmark,
  poseWrist: NormalizedLandmark,
  handIndexTip: NormalizedLandmark | undefined
) {
  // Define a horizontal reference vector (pointing right).
  const ref = { x: 1, y: 0 };

  // Create a vector from the pose wrist to the hand index tip.
  const v = handIndexTip
    ? { x: handIndexTip.x - poseWrist.x, y: handIndexTip.y - poseWrist.y }
    : { x: 0, y: 0 };

  // Calculate dot product and magnitudes for angle calculation.
  const dot = ref.x * v.x + ref.y * v.y;
  const magRef = Math.sqrt(ref.x * ref.x + ref.y * ref.y);
  const magV = Math.sqrt(v.x * v.x + v.y * v.y);

  // Avoid division by zero.
  if (magV === 0) return 0;

  // Calculate unsigned angle.
  let angle = Math.acos(dot / (magRef * magV)) * (180 / Math.PI);

  // Determine sign using cross product.
  const cross = ref.x * v.y - ref.y * v.x;
  if (cross < 0) angle = -angle;

  // Clamp the angle to the range of -60° to 60°.
  // return Math.max(-60, Math.min(60, angle));
  return angle;
}
const calculateRadialUlnars = (positions) => {
  const [poseElbow, poseWrist, handMiddleFingerTip] = positions; // Extract parameters

  // Define a horizontal reference vector (pointing to the right).
  const ref = { x: 1, y: 0 };

  // Compute the vector from the wrist to the middle fingertip.
  const v = {
    x: handMiddleFingerTip.x - poseWrist.x,
    y: handMiddleFingerTip.y - poseWrist.y,
  };

  // Calculate dot product and magnitudes for angle calculation.
  const dot = ref.x * v.x + ref.y * v.y;
  const magRef = Math.sqrt(ref.x ** 2 + ref.y ** 2);
  const magV = Math.sqrt(v.x ** 2 + v.y ** 2);

  // Avoid division by zero.
  if (magV === 0) return '0.00';

  // Calculate unsigned angle.
  let angle = Math.acos(dot / (magRef * magV)) * (180 / Math.PI);

  // Determine sign using cross product.
  const cross = ref.x * v.y - ref.y * v.x;
  if (cross < 0) angle = -angle;

  return angle.toFixed(2);
};

function calculateRadialUlnar(
  poseWrist: NormalizedLandmark,
  handMiddleFingerTip: NormalizedLandmark | undefined
) {
  if (!poseWrist || !handMiddleFingerTip) return null;

  // Define a horizontal reference vector (pointing to the right).
  const ref = { x: 1, y: 0 };

  // Compute the vector from the wrist to the middle fingertip.
  const v = {
    x: handMiddleFingerTip.x - poseWrist.x,
    y: handMiddleFingerTip.y - poseWrist.y,
  };

  // Calculate dot product and magnitudes for angle calculation.
  const dot = ref.x * v.x + ref.y * v.y;
  const magRef = Math.sqrt(ref.x * ref.x + ref.y * ref.y);
  const magV = Math.sqrt(v.x * v.x + v.y * v.y);

  // Avoid division by zero.
  if (magV === 0) return '0.00';

  // Calculate unsigned angle.
  let angle = Math.acos(dot / (magRef * magV)) * (180 / Math.PI);

  // Determine sign using cross product.
  const cross = ref.x * v.y - ref.y * v.x;
  if (cross < 0) angle = -angle;

  // Clamp the angle to the range of -30° (ulnar) to +20° (radial).
  angle = Math.max(-30, Math.min(20, angle));

  return angle.toFixed(2);
}

function calculateWristPronationSupination(
  poseWrist: NormalizedLandmark,
  handThumbTip: NormalizedLandmark | undefined
) {
  if (!poseWrist || !handThumbTip) return null;

  // Define a vertical reference vector (pointing upward).
  const ref = { x: 0, y: -1 };

  // Compute the vector from the wrist to the thumb tip.
  const v = {
    x: handThumbTip.x - poseWrist.x,
    y: handThumbTip.y - poseWrist.y,
  };

  // Calculate dot product and magnitudes for angle calculation.
  const dot = ref.x * v.x + ref.y * v.y;
  const magRef = Math.sqrt(ref.x * ref.x + ref.y * ref.y);
  const magV = Math.sqrt(v.x * v.x + v.y * v.y);

  // Avoid division by zero.
  if (magV === 0) return '0.00';

  // Calculate unsigned angle.
  let angle = Math.acos(dot / (magRef * magV)) * (180 / Math.PI);

  // Determine sign using cross product.
  const cross = ref.x * v.y - ref.y * v.x;
  if (cross < 0) angle = -angle;

  // Apply the angle correction.
  const angleFix = angle - 20.0;

  return angleFix.toFixed(2);
}

function VideoPoseEstimator(props: IVideoPoseEstimatorProps) {
  const [bodyPointsVisible, setBodyPointsVisible] = useState<boolean>(false);
  const [angleValue, setAngleValue] = useState<number>(0);
  const [coordinates, setCoordinates] = useState<NormalizedLandmark[]>([]);
  const [exercise, setExercise] = useState<string>('');

  const { isCustom } = useTypedSelector((state) => state.rom.main);
  const dispatch = useTypedDispatch();
  const prevBodyPointsVisible = usePrevious(bodyPointsVisible);

  const {
    currentExercise,
    isFullscreen,
    onBodyPointsVisible,
    onExerciseValueAndCoordinates,
    transition,
    onNextTransition,
    isSwitchMode,
    cameraId,
  } = props;

  const calculeAngles = useCallback(
    (results: NormalizedLandmark[]) => {
      if (isCustom) {
        if (bodyPointsVisible && currentExercise) {
          currentExercise?.exercises?.map((bodypoint, index) => {
            const defaultValue = { value: 0 };
            let a = defaultValue,
              b = defaultValue,
              c = defaultValue;
            if (bodypoint?.strapiOmniRomExercise?.pointsToValidatePosition) {
              ({ a, b, c } =
                bodypoint?.strapiOmniRomExercise?.pointsToValidatePosition);
            }

            console.log('results ---?', results);
            console.log('a,b,c', a, b, c);
            const angleValueCalculated = bodypoint?.strapiOmniRomExercise
              ?.function
              ? eval(`(${bodypoint?.strapiOmniRomExercise?.function})`)([
                  results[a?.value],
                  results[b?.value],
                  results[c?.value],
                ])
              : 0;

            const result = Math.floor(angleValueCalculated);

            setCoordinates(results);
            dispatch(
              setPoseData({
                index: index,
                angleResult: result,
                coordinates: results,
              })
            );
          });
        }
      } else {
        if (bodyPointsVisible && currentExercise) {
          const { a, b, c } = currentExercise?.pointsToCalculateAngle!;

          const angleValueCalculated = eval(`(${currentExercise?.function})`)([
            results[a?.value],
            results[b?.value],
            results[c?.value],
          ]);

          const result = Math.floor(+angleValueCalculated);

          if (result !== angleValue) {
            setAngleValue(result);
            setCoordinates(results);
          }
        } else {
          setAngleValue(0);
          setCoordinates(results);
        }
      }
    },
    [bodyPointsVisible, currentExercise]
  );
  const calculeAngle = useCallback(
    (results: NormalizedLandmark[]) => {
      // setBodyPointsVisible(true);
      const poseElbow = results[14];
      const poseWrist = results[16];
      const { handmarkLeft, handmarkRight } = latestHandResults;
      let handIndexTip: NormalizedLandmark | undefined;
      let middleFingertip: NormalizedLandmark | undefined;
      let thumbTip: NormalizedLandmark | undefined;
      if (handmarkRight) {
        handIndexTip = handmarkRight[8];
        middleFingertip = handmarkRight[12];
        thumbTip = handmarkRight[4];
      }

      const angle = calculateCombinedWristAngle(
        poseElbow,
        poseWrist,
        handIndexTip
      );
      const flex = angle > 0 ? angle : 0;
      const ext = angle < 0 ? Math.abs(angle) : 0;
      const wristRadialUlnar: unknown = calculateRadialUlnar(
        poseWrist,
        middleFingertip
      );
      const wristProSup: unknown = calculateWristPronationSupination(
        poseWrist,
        thumbTip
      );

      const supination = wristProSup < 0 ? Math.abs(wristProSup) : 0;
      const pronation = wristProSup > 0 ? wristProSup : 0;

      const ulnarDeviation =
        typeof wristRadialUlnar === 'number' && wristRadialUlnar < 0
          ? Math.abs(wristRadialUlnar)
          : 0;
      const radialDeviation =
        wristRadialUlnar && +wristRadialUlnar > 0 ? +wristRadialUlnar : 0;

      const result = Math.abs(wristProSup as number);
      setAngleValue(result);
      setCoordinates(results);
      // setExercise('Wrist Flexion:');
      // setExercise('Wrist Extension:');
      setExercise('Wrist Supination:');

      // if (isCustom) {
      // 	if (bodyPointsVisible && currentExercise) {
      // 		const { a, b, c } = currentExercise?.pointsToCalculateAngle!;

      // 		const angleValueCalculated = eval(`(${currentExercise?.function})`)([
      // 			results[a?.value],
      // 			results[b?.value],
      // 			results[c?.value],
      // 		]);

      // 		const result = Math.floor(+angleValueCalculated);

      // 		if (result !== angleValue) {
      // 			setAngleValue(result);
      // 			setCoordinates(results);
      // 		}
      // 	} else {
      // 		setAngleValue(0);
      // 		setCoordinates(results);
      // 	}
      // }
    },
    [bodyPointsVisible, currentExercise]
  );

  // const checkBodyIsVisible = useCallback(
  // 	(results: NormalizedLandmark[]) => {
  // 		if (isCustom) {
  // 			if (currentExercise) {
  // 				const validateBodyPoints = currentExercise?.exercises?.every(
  // 					bodyPoint => {
  // 						const defaultValue = { value: 0 };
  // 						let a = defaultValue,
  // 							b = defaultValue,
  // 							c = defaultValue;
  // 						if (bodyPoint?.strapiOmniRomExercise?.pointsToValidatePosition) {
  // 							({ a, b, c } =
  // 								bodyPoint?.strapiOmniRomExercise?.pointsToValidatePosition);
  // 						}

  // 						const isVisible =
  // 							(results[a.value]?.visibility! > limit &&
  // 								results[b.value]?.visibility! > limit &&
  // 								results[c.value]?.visibility! > limit) ||
  // 							false;

  // 						return isVisible;
  // 					},
  // 				);

  // 				setBodyPointsVisible(validateBodyPoints || false);
  // 			}
  // 		} else {
  // 			if (currentExercise) {
  // 				const { a, b, c } = currentExercise?.pointsToValidatePosition!;
  // 				const isVisible =
  // 					(results[a.value]?.visibility! > limit &&
  // 						results[b.value]?.visibility! > limit &&
  // 						results[c.value]?.visibility! > limit) ||
  // 					false;
  // 				setBodyPointsVisible(isVisible);
  // 			} else {
  // 				setBodyPointsVisible(true);
  // 			}
  // 		}
  // 	},
  // 	[currentExercise],
  // );
  const checkBodyIsVisible = useCallback(
    (results: NormalizedLandmark[]) => {
      setBodyPointsVisible(true);
    },
    [currentExercise]
  );

  const frameCallback = useCallback(
    (results: NormalizedLandmark[]) => {
      if (transition?.value === ETransitions.CALIBRATION) {
        checkBodyIsVisible(results);
      }
      if (transition?.value === ETransitions.READYSETGO) {
        calculeAngle(results);
      }
    },
    [transition]
  );

  useEffect(() => {
    window.removeEventListener('results', () => {});

    window.addEventListener('results', (event) => {
      const results = (event as CustomEvent).detail?.results;
      frameCallback(results);
      latestPoseResults = results;
    });

    return () => {
      window.removeEventListener('results', () => {});
    };
  }, [frameCallback]);

  useEffect(() => {
    window.removeEventListener('handmarks', () => {});

    window.addEventListener('handmarks', (event) => {
      const handData = (event as CustomEvent).detail;
      latestHandResults = handData;
    });

    return () => {
      window.removeEventListener('handmarks', () => {});
    };
  }, [frameCallback]);

  useEffect(() => {
    console.log('bodyPointsVisible', bodyPointsVisible);
    if (bodyPointsVisible !== prevBodyPointsVisible) {
      onBodyPointsVisible(bodyPointsVisible);
    }
  }, [prevBodyPointsVisible, bodyPointsVisible, onBodyPointsVisible]);

  useEffect(() => {
    if (transition?.value === ETransitions.CLOSING) {
      onExerciseValueAndCoordinates(angleValue, coordinates);
    }
  }, [transition, onExerciseValueAndCoordinates, angleValue, coordinates]);

  useEffect(() => {
    if (transition?.value === ETransitions.INTRO) {
      setBodyPointsVisible(false);
      setAngleValue(0);
      setCoordinates([]);
    }
  }, [transition]);

  useEffect(() => {
    if (transition?.value === ETransitions.CALIBRATION && bodyPointsVisible) {
      onNextTransition(transition.next!);
    }
  }, [transition, bodyPointsVisible, onNextTransition]);

  return (
    <Content
      style={{
        overflow: 'hidden',
        width: isFullscreen ? '100vw' : 'auto',
        height: isFullscreen ? 'calc(100vh - 35px)' : 720,
      }}
    >
      {!currentExercise ? (
        <Loading />
      ) : (
        <div id="printscreen">
          {(transition?.value == ETransitions.READYSETGO ||
            transition?.value == ETransitions.CLOSING) && (
            <Symetrograph isFullscreen={isFullscreen} />
          )}
          <div
            style={{
              aspectRatio: '16/9',
              display: currentExercise ? 'block' : 'none',
              width: isSwitchMode ? '420px' : '100%',
              zIndex: isSwitchMode ? 3 : 2,
              position: 'relative',
            }}
          >
            <Mediapipe cameraId={cameraId} />
          </div>
          <Typography.Title
            level={1}
            style={{
              position: 'absolute',
              top: '22%',
              right: '10%',
              color: '#fff',
              backgroundColor: 'black',
              fontSize: '20px',
              fontWeight: 300,
              zIndex: 2,
            }}
          >
            {exercise} {Math.floor(angleValue || 0)} º
            {/* <Typography.Text
							style={{
								position: 'absolute',
								top: '12px',
								fontWeight: 300,
								color: '#fff',
								backgroundColor: 'black',
								fontSize: '25px',
							}}>
							º
						</Typography.Text> */}
          </Typography.Title>
          {!isCustom && transition?.value === ETransitions.READYSETGO && (
            <Typography.Title
              level={1}
              style={{
                position: 'absolute',
                top: '22%',
                right: '10%',
                color: '#fff',
                fontSize: '100px',
                fontWeight: 300,
                zIndex: 2,
              }}
            >
              {Math.floor(angleValue || 0)}
              <Typography.Text
                style={{
                  position: 'absolute',
                  top: '12px',
                  fontWeight: 300,
                  color: '#fff',
                  fontSize: '50px',
                }}
              >
                º
              </Typography.Text>
            </Typography.Title>
          )}
        </div>
      )}
    </Content>
  );
}

export default memo(VideoPoseEstimator);
