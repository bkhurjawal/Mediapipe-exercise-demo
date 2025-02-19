import { Pose } from '@mediapipe/pose';
import * as tf from '@tensorflow/tfjs';

import {
  DrawingUtils,
  PoseLandmarker,
  FilesetResolver,
} from 'https://cdn.skypack.dev/@mediapipe/tasks-vision@0.10.0';

export const initializePoseDetector = async () => {
  try {
    const pose = new Pose({
      locateFile: (file) => {
        // return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
        // return `/${file}`;
        return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
      },
    });

    pose.setOptions({
      modelComplexity: 1,
      smoothLandmarks: true,
      enableSegmentation: false,
      smoothSegmentation: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    await pose.initialize();
    return pose;
  } catch (error) {
    console.error('Error initializing pose detector:', error);
    throw error;
  }
};
