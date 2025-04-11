import Loading from '@atoms/APLoading';
import { NormalizedLandmark } from '@mediapipe/tasks-vision';
import { useTypedDispatch, useTypedSelector } from '@stores/index';
import { ICustomRomExercise } from '@stores/interfaces';
import { ETransitions, setPoseData, TTransitions } from '@stores/rom/main';
import usePrevious from '@utils/usePrevious.hook';
import { Typography } from 'antd';
import { Content } from 'antd/lib/layout/layout';
import { memo, useCallback, useEffect, useState } from 'react';
import Symetrograph from './Components/Symetrograph';
import Mediapipe from './mediapipe';
import { tr } from 'date-fns/locale';

const limit = 0.6;

interface IVideoPoseEstimatorProps {
  isCompleted: boolean;
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

let latestHandResults: {
  handmarkLeft?: NormalizedLandmark[];
  handmarkRight?: NormalizedLandmark[];
} = {};

function VideoPoseEstimator(props: IVideoPoseEstimatorProps) {
  const [bodyPointsVisible, setBodyPointsVisible] = useState<boolean>(false);
  const [angleValue, setAngleValue] = useState<number>(0);
  const [coordinates, setCoordinates] = useState<NormalizedLandmark[]>([]);

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
    isCompleted,
  } = props;

  const calculeAngle = useCallback(
    (results: NormalizedLandmark[]) => {
      if (isCustom) {
        if (bodyPointsVisible && currentExercise) {
          currentExercise?.exercises?.map((bodypoint, index) => {
            const defaultValue = { value: 0 };
            let a = defaultValue,
              b = defaultValue,
              c = defaultValue,
              d = defaultValue;
            if (bodypoint?.strapiOmniRomExercise?.pointsToValidatePosition) {
              ({ a, b, c, d } =
                bodypoint?.strapiOmniRomExercise?.pointsToValidatePosition);
            }
            console.log(
              'currentExercise -->',
              currentExercise?.name?.toLowerCase()
            );
            console.log(
              'currentExercise wrist -->',
              currentExercise?.name?.toLowerCase()?.includes('wrist')
            );
            console.log(
              'currentExercise right-->',
              currentExercise?.name?.toLowerCase()?.includes('right')
            );
            console.log(
              'currentExercise flexion-->',
              currentExercise?.name?.toLowerCase()?.includes('flexion')
            );
            let angleValueCalculated;
            if (currentExercise?.name?.toLowerCase()?.includes('wrist')) {
              alert('wrist');
              const { handmarkLeft, handmarkRight } = latestHandResults;
              let hand;
              if (currentExercise?.name?.toLowerCase()?.includes('right')) {
                hand = handmarkRight;
              } else {
                hand = handmarkLeft;
              }
              let value;
              if (
                currentExercise?.name?.toLowerCase()?.includes('flexion') ||
                currentExercise?.name?.toLowerCase()?.includes('extension')
              ) {
                value = 8;
              } else {
                value = 20;
              }
              if (hand) {
                angleValueCalculated = bodypoint?.strapiOmniRomExercise
                  ?.function
                  ? eval(`(${bodypoint?.strapiOmniRomExercise?.function})`)([
                      results[a?.value],
                      results[b?.value],
                      hand[value],
                    ])
                  : 0;
              }

              console.log('hand', hand);
              console.log('value', hand);
              console.log('angleValueCalculated', angleValueCalculated);
            } else {
              angleValueCalculated = bodypoint?.strapiOmniRomExercise?.function
                ? eval(`(${bodypoint?.strapiOmniRomExercise?.function})`)(
                    [
                      results[a?.value],
                      results[b?.value],
                      results[c?.value],
                      results[d?.value],
                    ],
                    {
                      width: 1280,
                      height: 720,
                    }
                  )
                : 0;
            }

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
          const { a, b, c, d } = currentExercise?.pointsToCalculateAngle!;

          let angleValueCalculated;
          if (currentExercise?.name?.toLowerCase()?.includes('wrist')) {
            const { handmarkLeft, handmarkRight } = latestHandResults;
            let hand;
            if (currentExercise?.name?.toLowerCase()?.includes('right')) {
              hand = handmarkRight;
            } else {
              hand = handmarkLeft;
            }

            if (hand) {
              angleValueCalculated = bodypoint?.strapiOmniRomExercise?.function
                ? eval(`(${bodypoint?.strapiOmniRomExercise?.function})`)([
                    results[a?.value],
                    results[b?.value],
                    hand[c?.value],
                    results[d?.value],
                  ])
                : 0;
            }
          } else {
            angleValueCalculated = eval(`(${currentExercise?.function})`)(
              [
                results[a?.value],
                results[b?.value],
                results[c?.value],
                results[d?.value],
              ],
              {
                width: 1280,
                height: 720,
              }
            );
          }

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

  const checkBodyIsVisible = useCallback(
    (results: NormalizedLandmark[]) => {
      if (isCustom) {
        if (currentExercise) {
          const validateBodyPoints = currentExercise?.exercises?.every(
            (bodyPoint) => {
              const defaultValue = { value: 0 };
              let a = defaultValue,
                b = defaultValue,
                c = defaultValue;
              if (bodyPoint?.strapiOmniRomExercise?.pointsToValidatePosition) {
                ({ a, b, c } =
                  bodyPoint?.strapiOmniRomExercise?.pointsToValidatePosition);
              }

              const isVisible =
                (results[a.value]?.visibility! > limit &&
                  results[b.value]?.visibility! > limit &&
                  results[c.value]?.visibility! > limit) ||
                false;

              return isVisible;
            }
          );

          setBodyPointsVisible(validateBodyPoints || false);
        }
      } else {
        if (currentExercise) {
          const { a, b, c } = currentExercise?.pointsToValidatePosition!;
          const isVisible =
            (results[a.value]?.visibility! > limit &&
              results[b.value]?.visibility! > limit &&
              results[c.value]?.visibility! > limit) ||
            false;
          setBodyPointsVisible(isVisible);
        } else {
          setBodyPointsVisible(true);
        }
      }
    },
    [currentExercise]
  );

  const frameCallback = useCallback(
    (results: NormalizedLandmark[]) => {
      if (transition?.value === ETransitions.CALIBRATION) {
        // checkBodyIsVisible(results);
        setBodyPointsVisible(true);
        calculeAngle(results);
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
    });

    return () => {
      window.removeEventListener('results', () => {});
    };
  }, []);

  useEffect(() => {
    window.removeEventListener('handmarks', () => {});

    window.addEventListener('handmarks', (event) => {
      const handData = (event as CustomEvent).detail;
      latestHandResults = handData;
    });

    return () => {
      window.removeEventListener('handmarks', () => {});
    };
  }, []);

  useEffect(() => {
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
      {!currentExercise && !isCompleted ? (
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
          {/* <Typography.Title
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
						}}>
						{exercise} {Math.floor(angleValue || 0)} º
					</Typography.Title> */}
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
