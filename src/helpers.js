export const neckLeftRotation = (positions) => {
  const [nose, leftShoulder, rightShoulder] = positions;

  // Midpoint between shoulders
  const midX = (leftShoulder.x + rightShoulder.x) / 2;
  const midY = (leftShoulder.y + rightShoulder.y) / 2;

  // Vector from shoulder-midpoint to nose
  const dx = nose.x - midX;
  const dy = nose.y - midY;

  // Angle in degrees from the +X axis
  let angle = Math.atan2(dy, dx) * (180 / Math.PI);

  // Shift so that 0° = upright
  let angleFromVertical = angle + 90;

  // Ensure positive rotation
  const neckRotation = angleFromVertical.toFixed(2);
  const rightRotation = neckRotation < 0 ? Math.abs(neckRotation) : 0;
  const leftRotation = neckRotation > 0 ? neckRotation : 0;
  return neckRotation * 8;
};

export const calculateLumbarRotation = (positions) => {
  // Assuming landmarks are provided by MediaPipe Pose in normalized coordinates
  const [leftHip, rightHip, leftShoulder, rightShoulder] = positions;
  // 1. Hip Center
  const hipCenterX = (leftHip.x + rightHip.x) / 2;
  const hipCenterY = (leftHip.y + rightHip.y) / 2;
  // 2. Shoulder Line
  const shoulderMidX = (leftShoulder.x + rightShoulder.x) / 2;
  const shoulderMidY = (leftShoulder.y + rightShoulder.y) / 2;
  // 3. Torso Vector
  const torsoVectorX = shoulderMidX - hipCenterX;
  const torsoVectorY = shoulderMidY - hipCenterY;
  // 4. Calculate Rotation (simplified - 2D angle)
  const rotation = Math.atan2(torsoVectorY, torsoVectorX); // Radians
  // Convert to degrees if needed
  const rotationDegrees = rotation * (180 / Math.PI);
  return rotationDegrees.toFixed(2);
};

export const calculateLumbarRotationDeepSeek = (positions) => {
  // Assuming landmarks are provided by MediaPipe Pose in normalized coordinates

  const [leftHip, rightHip, leftShoulder, rightShoulder] = positions;

  // Compute midpoints for hips and shoulders
  const hipCenter = {
    x: (leftHip.x + rightHip.x) / 2,
    y: (leftHip.y + rightHip.y) / 2,
  };

  const shoulderCenter = {
    x: (leftShoulder.x + rightShoulder.x) / 2,
    y: (leftShoulder.y + rightShoulder.y) / 2,
  };

  // Compute torso vector (from hip center to shoulder center)
  const v = {
    x: shoulderCenter.x - hipCenter.x,
    y: shoulderCenter.y - hipCenter.y,
  };

  // Define vertical reference vector (pointing straight up)
  const ref = { x: 0, y: -1 };

  // Calculate dot product and magnitudes
  const dot = ref.x * v.x + ref.y * v.y;
  const magRef = Math.sqrt(ref.x ** 2 + ref.y ** 2);
  const magV = Math.sqrt(v.x ** 2 + v.y ** 2);

  if (magV === 0) return '0.00'; // Avoid division by zero

  // Calculate angle using acos (in degrees)
  let angle = Math.acos(dot / (magRef * magV)) * (180 / Math.PI);

  // Determine sign using cross product
  const cross = ref.x * v.y - ref.y * v.x;
  if (cross < 0) angle = -angle;
  const angleFix = (angle * 10).toFixed(2);

  return angleFix;
  return angleFix < 0 ? Math.abs(angleFix) : 0;
};

export const calculateUlnarDeviation = (p0, p1, p2) => {
  if (!p0 || !p1 || !p2) return null;

  // Calculate angle between wrist, index, and pinky
  const a = Math.pow(p1.x - p0.x, 2) + Math.pow(p1.y - p0.y, 2);
  const b = Math.pow(p2.x - p0.x, 2) + Math.pow(p2.y - p0.y, 2);
  const c = Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2);

  let angle = Math.acos((a + b - c) / Math.sqrt(4 * a * b)) * (180 / Math.PI);
  let deviation = Math.max(0, 90 - angle);

  return Math.round(deviation * 100) / 100;
};

export function calculateLumbarRotationTest(landmarks) {
  // Assuming landmarks are provided by MediaPipe Pose in normalized coordinates

  // 1. Hip Center
  const leftHip = landmarks[23]; // Landmark IDs may vary, check MediaPipe docs
  const rightHip = landmarks[24];
  const hipCenterX = (leftHip.x + rightHip.x) / 2;
  const hipCenterY = (leftHip.y + rightHip.y) / 2;

  // 2. Shoulder Line
  const leftShoulder = landmarks[11];
  const rightShoulder = landmarks[12];
  const shoulderMidX = (leftShoulder.x + rightShoulder.x) / 2;
  const shoulderMidY = (leftShoulder.y + rightShoulder.y) / 2;

  // 3. Torso Vector
  const torsoVectorX = shoulderMidX - hipCenterX;
  const torsoVectorY = shoulderMidY - hipCenterY;

  // 4. Calculate Rotation (simplified - 2D angle)
  let rotation = Math.atan2(torsoVectorY, torsoVectorX); // Radians

  // Convert to degrees
  let rotationDegrees = rotation * (180 / Math.PI);

  // Quantize to nearest 10 degrees
  let quantizedRotation = Math.round(rotationDegrees / 10) * 10;

  return quantizedRotation;
}

const dev = (positions) => {
  const [poseElbow, poseWrist, handMiddleFingerTip] = positions;
  const ref = { x: -1, y: 0 };
  const v = {
    x: handMiddleFingerTip.x - poseWrist.x,
    y: handMiddleFingerTip.y - poseWrist.y,
  };
  const dot = ref.x * v.x + ref.y * v.y;
  const magRef = Math.sqrt(ref.x ** 2 + ref.y ** 2);
  const magV = Math.sqrt(v.x ** 2 + v.y ** 2);
  if (magV === 0) return 0;
  let angle = Math.acos(dot / (magRef * magV)) * (180 / Math.PI);
  const cross = ref.x * v.y - ref.y * v.x;
  if (cross < 0) angle = -angle;
  return angle < 0 ? Math.abs(angle) : 0;
};

export const calculateRadialDeviation = (p0, p1, p2) => {
  if (!p0 || !p1 || !p2) return null;

  // Same formula as ulnar deviation
  return calculateUlnarDeviation(p0, p1, p2);
};

export const calculatePronation = (p0, p1, p2) => {
  if (!p0 || !p1 || !p2) return null;

  // Calculate rotation angle of forearm
  const a = Math.pow(p1.x - p0.x, 2) + Math.pow(p1.y - p0.y, 2);
  const b = Math.pow(p2.x - p0.x, 2) + Math.pow(p2.y - p0.y, 2);
  const c = Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2);

  let angle = Math.acos((a + b - c) / Math.sqrt(4 * a * b)) * (180 / Math.PI);
  let pronation = Math.max(0, 90 - angle);

  return Math.round(pronation * 100) / 100;
};

export const calculateSupination = (p0, p1, p2) => {
  if (!p0 || !p1 || !p2) return null;

  // Same formula as pronation
  return calculatePronation(p0, p1, p2);
};

export const calculateLumbarRotations = (
  leftShoulder,
  rightShoulder,
  leftHip,
  rightHip
) => {
  if (!leftShoulder || !rightShoulder || !leftHip || !rightHip) return null;

  const midHip = {
    x: (leftHip.x + rightHip.x) / 2,
    y: (leftHip.y + rightHip.y) / 2,
  };

  // Calculate vectors
  const leftVector = {
    x: leftShoulder.x - midHip.x,
    y: leftShoulder.y - midHip.y,
  };
  const rightVector = {
    x: rightShoulder.x - midHip.x,
    y: rightShoulder.y - midHip.y,
  };

  // Calculate angles using atan2 (handles all quadrants correctly)
  const leftAngle = Math.atan2(leftVector.y, leftVector.x);
  const rightAngle = Math.atan2(rightVector.y, rightVector.x);

  // Calculate the difference in angles
  let angleDifference = rightAngle - leftAngle;

  // Normalize the angle to be between -180 and 180 degrees
  angleDifference = ((angleDifference + Math.PI) % (2 * Math.PI)) - Math.PI;

  // Convert to degrees
  let rotationDegrees = angleDifference * (180 / Math.PI);

  // You might want to smooth the angle here using a moving average or filter

  return rotationDegrees;
};

export const calculateNeckRotation = (p0, p1, p2) => {
  if (!p0 || !p1 || !p2) return null;

  // Calculate the angle between nose (p0), left shoulder (p1), and right shoulder (p2)
  const a = Math.pow(p1.x - p0.x, 2) + Math.pow(p1.y - p0.y, 2);
  const b = Math.pow(p2.x - p0.x, 2) + Math.pow(p2.y - p0.y, 2);
  const c = Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2);

  let angle = Math.acos((a + b - c) / Math.sqrt(4 * a * b)) * (180 / Math.PI);

  // Convert angle to rotation format
  let neckRotation = Math.max(0, 90 - angle); // Ensure it starts from 0° at neutral

  return Math.round(neckRotation * 100) / 100; // Round to 2 decimal places
};

export const calculateNeckLateralBending = (p0, p1, p2) => {
  if (!p0 || !p1 || !p2) return null;

  // Calculate the angle between nose (p0), left shoulder (p1), and right shoulder (p2)
  const a = Math.pow(p1.x - p0.x, 2) + Math.pow(p1.y - p0.y, 2);
  const b = Math.pow(p2.x - p0.x, 2) + Math.pow(p2.y - p0.y, 2);
  const c = Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2);

  let angle = Math.acos((a + b - c) / Math.sqrt(4 * a * b)) * (180 / Math.PI);

  // Convert angle to lateral bending format
  let neckLateralBending = Math.max(0, 90 - angle); // Ensure it starts from 0° at neutral

  return Math.round(neckLateralBending * 100) / 100; // Round to 2 decimal places
};

export const calculateWristFlexion = (p0, p1, p2) => {
  if (!p0 || !p1 || !p2) return null;

  // Calculate the difference in X and Y coordinates
  const dx = p2.x - p1.x; // Index finger to Wrist
  const dy = p2.y - p1.y;

  // Compute the angle in degrees
  let angle = Math.atan2(dy, dx) * (180 / Math.PI);

  // Convert the angle to a wrist flexion format
  let wristFlexion = Math.max(0, Math.abs(angle) - 90); // Ensure it starts from 0° at neutral

  return Math.round(wristFlexion * 100) / 100; // Round to 2 decimal places
};

export const calculateWristExtension = (p0, p1, p2) => {
  if (!p0 || !p1 || !p2) return null;

  // Calculate the difference in X and Y coordinates
  const dx = p2.x - p1.x; // Index finger to Wrist
  const dy = p2.y - p1.y;

  // Compute the angle in degrees
  let angle = Math.atan2(dy, dx) * (180 / Math.PI);

  // Convert the angle to a wrist extension format
  let wristExtension = Math.max(0, 90 - Math.abs(angle)); // Ensure it starts from 0° at neutral

  return Math.round(wristExtension * 100) / 100; // Round to 2 decimal places
};

export const calculateNeckExtension = (p0, p1, p2) => {
  if (!p0 || !p1 || !p2) return null;

  // Calculate the difference in X and Y coordinates
  const dx = p0.x - p1.x;
  const dy = p0.y - p1.y;

  // Compute the angle in degrees
  let angle = Math.atan2(dy, dx) * (180 / Math.PI);

  // Convert the angle to a neck extension format
  let neckExtension = Math.max(0, 90 - Math.abs(angle)); // Ensure it starts from 0° at neutral

  return Math.round(neckExtension * 100) / 100; // Round to 2 decimal places
};

export const calculateNeckFlexion = (p0, p1, p2) => {
  if (!p0 || !p1 || !p2) return null;

  // Calculate the difference in X and Y coordinates
  const dx = p2.x - p1.x; // Nose to Shoulder
  const dy = p2.y - p1.y;

  // Compute the angle in degrees
  let angle = Math.atan2(dy, dx) * (180 / Math.PI);

  // Convert the angle to a neck flexion format
  let neckFlexion = Math.max(0, Math.abs(angle) - 90); // Ensure it starts from 0° at neutral

  return Math.round(neckFlexion * 100) / 100; // Round to 2 decimal places
};

export const calculateLumbarFlexion = (p0, p1, p2) => {
  if (!p0 || !p1 || !p2) return null;

  const a = Math.pow(p1.x - p0.x, 2) + Math.pow(p1.y - p0.y, 2);
  const b = Math.pow(p2.x - p0.x, 2) + Math.pow(p2.y - p0.y, 2);
  const c = Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2);

  let angle = Math.acos((a + b - c) / Math.sqrt(4 * a * b)) * (180 / Math.PI);

  // Convert the standard angle to lumbar flexion format
  let lumbarFlexion = Math.max(0, 180 - angle); // Ensure no negative values

  return Math.round(lumbarFlexion * 100) / 100; // Round to 2 decimal places
};

export const calculateLumbarLateral = (
  nose,
  leftHip,
  rightHip,
  leftShoulder
) => {
  // 1. Validate all 4 landmarks exist
  if (!nose || !leftHip || !rightHip || !leftShoulder) return null;

  // 2. Pick which hip you want to use in your angle calculation.
  //    For instance, let's continue using the leftHip (like your original logic).
  //    If you prefer the rightHip, just swap references below.
  const dx = nose.x - leftHip.x;
  const dy = nose.y - leftHip.y;

  // 3. Calculate the angle in degrees from nose->hip
  let angle = Math.atan2(dy, dx) * (180 / Math.PI);

  // 4. Convert to "lateral flexion" format: 0° at neutral (±90° from horizontal)
  let lumbarLateralFlexion = Math.max(0, Math.abs(angle) - 90);

  // 5. Return the final angle, rounded to 2 decimals
  return Math.round(lumbarLateralFlexion * 100) / 100;
};

export const calculateLumbarLateralFlexion = (p0, p1, p2) => {
  if (!p0 || !p1 || !p2) return null;

  // Calculate the difference in X and Y coordinates
  const dx = p0.x - p2.x; // Nose to Hip
  const dy = p0.y - p2.y;

  // Compute the angle in degrees
  let angle = Math.atan2(dy, dx) * (180 / Math.PI);

  // Convert the angle to a lateral flexion format
  let lumbarLateralFlexion = Math.max(0, Math.abs(angle) - 90); // Ensure it starts from 0° at neutral

  return Math.round(lumbarLateralFlexion * 100) / 100; // Round to 2 decimal places
};

export const calculateLumbarExtension = (p0, p1, p2) => {
  if (!p0 || !p1 || !p2) return null;

  const a = Math.pow(p1.x - p0.x, 2) + Math.pow(p1.y - p0.y, 2);
  const b = Math.pow(p2.x - p0.x, 2) + Math.pow(p2.y - p0.y, 2);
  const c = Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2);

  let angle = Math.acos((a + b - c) / Math.sqrt(4 * a * b)) * (180 / Math.PI);

  // Ensure 0° when standing straight and increase with backward bending
  angle = Math.abs(180 - angle);

  return Math.round(angle * 100) / 100;
};

export const skeletonColors = {
  nose: 'rgb(255, 0, 0)',
  neck: 'rgb(255, 85, 0)',
  top_of_the_head: 'rgb(255, 85, 0)',
  chin: 'rgb(255, 85, 0)',
  right_elbow: 'rgb(255, 255, 0)',
  left_elbow: 'rgb(0, 255, 0)',
  right_wrist: 'rgb(170, 255, 0)',
  left_wrist: 'rgb(0, 255, 85)',
  left_shoulder: 'rgb(85, 255, 0)',
  right_shoulder: 'rgb(255, 170, 0)',
  left_hip: 'rgb(0, 85, 255)',
  right_hip: 'rgb(0, 255, 170)',
  left_knee: 'rgb(0, 0, 255)',
  right_knee: 'rgb(0, 255, 255)',
  left_ankle: 'rgb(85, 0, 255)',
  right_ankle: 'rgb(0, 170, 255)',
  left_eye: 'rgb(255, 0, 255)',
  right_eye: 'rgb(170, 0, 255)',
  left_ear: 'rgb(255, 0, 85)',
  right_ear: 'rgb(255, 0, 170)',
  left_thumb: 'rgb(0, 255, 0)',
  right_thumb: 'rgb(0, 0, 255)',
  left_finger: 'rgb(0, 255, 0)',
  right_finger: 'rgb(0, 0, 255)',
  left_bigtoe: 'rgb(85, 0, 255)',
  right_bigtoe: 'rgb(85, 0, 255)',
  left_heel: 'rgb(85, 0, 255)',
  right_heel: 'rgb(85, 0, 255)',
  back_1: 'rgb(255, 0, 0)',
  back_2: 'rgb(255, 0, 0)',
  back_3: 'rgb(255, 0, 0)',
  back_4: 'rgb(255, 0, 0)',
  back_5: 'rgb(255, 0, 0)',
  front_1: 'rgb(70, 130, 180)',
  front_2: 'rgb(70, 130, 180)',
  front_3: 'rgb(70, 130, 180)',
  front_4: 'rgb(70, 130, 180)',
  front_5: 'rgb(70, 130, 180)',
  left_shoulder_hand: 'rgb(0, 255, 0)',
  right_shoulder_hand: 'rgb(0, 0, 255)',
  left_shoulder_neck: 'rgb(0, 255, 0)',
  right_shoulder_neck: 'rgb(0, 0, 255)',
  left_under_ear: 'rgb(0, 255, 0)',
  right_under_ear: 'rgb(0, 0, 255)',
  neck_top: 'rgb(255, 0, 0)',
  back_neck_top: 'rgb(200, 128, 128)',
};

const calculate = (positions) => {
  const [p0, p1, p2] = positions;
  const a = Math.pow(p1.x - p0.x, 2) + Math.pow(p1.y - p0.y, 2);
  const b = Math.pow(p2.x - p0.x, 2) + Math.pow(p2.y - p0.y, 2);
  const c = Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2);
  let angle = Math.acos((a + b - c) / Math.sqrt(4 * a * b)) * (180 / Math.PI);
  let lumbarRotation = Math.max(0, 90 - angle);
  return Math.round(lumbarRotation * 100) / 100;
};

// Compute the angle between two 2D vectors (in degrees)
function angleBetweenVectors(v1, v2) {
  const dot = v1.x * v2.x + v1.y * v2.y;
  const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
  const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
  if (mag1 === 0 || mag2 === 0) return 0;
  let angle = Math.acos(dot / (mag1 * mag2));
  return (angle * 180) / Math.PI;
}

// Compute a signed angle from v1 to v2 using the cross product.
function signedAngle(v1, v2) {
  const cross = v1.x * v2.y - v1.y * v2.x;
  const unsigned = angleBetweenVectors(v1, v2);
  // In standard image coordinates, if cross < 0, then v2 is above v1 (negative angle).
  return cross < 0 ? -unsigned : unsigned;
}

// Combined approach: uses pose wrist (and optionally elbow for consistency) and hand landmarks.
export function calculateCombinedWristAngle(
  poseElbow,
  poseWrist,
  handIndexTip
) {
  // Choose a hand landmark as the reference for hand orientation.
  // Here we use the index finger tip (landmark index 8 in Mediapipe Hand Landmarker).

  // Define a horizontal reference vector (pointing right)
  const ref = { x: 1, y: 0 };

  // Create a vector from the pose wrist (more stable) to the hand index tip.
  const v = {
    x: handIndexTip.x - poseWrist.x,
    y: handIndexTip.y - poseWrist.y,
  };

  // Compute the signed angle between the horizontal and our vector.
  let angle = signedAngle(ref, v);

  // Clamp the angle to the maximum range of 60°
  if (angle > 60) angle = 60;
  if (angle < -60) angle = -60;

  return angle;
}

// // Returns flexion (hand downward) as a positive value in [0, 60]
// export function calculateCombinedWristFlexion(
//   poseElbow,
//   poseWrist,
//   handLandmarks
// ) {
//   const angle = calculateCombinedWristAngle(
//     poseElbow,
//     poseWrist,
//     handLandmarks
//   );
//   return angle > 0 ? angle : 0;
// }

// // Returns extension (hand upward) as a positive value in [0, 60]
// export function calculateCombinedWristExtension(
//   poseElbow,
//   poseWrist,
//   handLandmarks
// ) {
//   const angle = calculateCombinedWristAngle(
//     poseElbow,
//     poseWrist,
//     handLandmarks
//   );
//   return angle < 0 ? Math.abs(angle) : 0;
// }

/**
 * Calculates the wrist flexion/extension angle using the middle fingertip.
 * The reference is a horizontal vector:
 *   - 0° means the middle fingertip is horizontally aligned with the wrist.
 *   - A positive angle (up to +20°) indicates radial deviation (middle fingertip above horizontal).
 *   - A negative angle (down to -30°) indicates ulnar deviation (middle fingertip below horizontal).
 *
 * @param {Object} poseWrist - The wrist landmark from the pose detector.
 * @param {Object} handMiddleFingerTip - The middle fingertip landmark from the hand detector.
 * @returns {number} The clamped wrist flexion/extension angle.
 */
export function calculateRadialUlnar(poseWrist, handMiddleFingerTip) {
  if (!poseWrist || !handMiddleFingerTip) return null;

  // Define a horizontal reference vector (pointing to the right).
  const ref = { x: 1, y: 0 };

  // Compute the vector from the wrist to the middle fingertip.
  const v = {
    x: handMiddleFingerTip.x - poseWrist.x,
    y: handMiddleFingerTip.y - poseWrist.y,
  };

  // Calculate the signed angle between the horizontal reference and the vector.
  let angle = signedAngle(ref, v);

  // Clamp the angle:
  // - Upward (radial) deviation: maximum +20°
  // - Downward (ulnar) deviation: maximum -30°
  // if (angle > 20) angle = 20;
  // else if (angle < -30) angle = -30;

  return angle.toFixed(2);
}

export function calculateRadialUlnarLeft(poseWrist, handMiddleFingerTip) {
  if (!poseWrist || !handMiddleFingerTip) return null;

  const ref = { x: -1, y: 0 };

  const v = {
    x: handMiddleFingerTip.x - poseWrist.x,
    y: handMiddleFingerTip.y - poseWrist.y,
  };

  const dot = ref.x * v.x + ref.y * v.y;
  const magRef = Math.sqrt(ref.x ** 2 + ref.y ** 2);
  const magV = Math.sqrt(v.x ** 2 + v.y ** 2);

  if (magV === 0) return '0.00';

  let angle = Math.acos(dot / (magRef * magV)) * (180 / Math.PI);

  const cross = ref.x * v.y - ref.y * v.x;
  if (cross > 0) angle = -angle;

  return angle.toFixed(2);
}

/**
 * Calculates the wrist pronation/supination angle using the thumb tip.
 * The reference is a vertical vector (pointing upward).
 * When the thumb is exactly vertical (up), the angle is 0.
 * A positive angle indicates one rotational direction (e.g., pronation),
 * and a negative angle indicates the opposite (e.g., supination).
 *
 * @param {Object} poseWrist - The wrist landmark from the pose detector.
 * @param {Object} handThumbTip - The thumb tip landmark from the hand detector.
 * @returns {number} The wrist pronation/supination angle.
 */
export function calculateWristPronationSupination(poseWrist, handThumbTip) {
  if (!poseWrist || !handThumbTip) return null;

  // Define a vertical reference vector (pointing upward).
  // Note: In image coordinates, upward means a decreasing y value.
  const ref = { x: 0, y: -1 };

  // Compute the vector from the wrist to the thumb tip.
  const v = {
    x: handThumbTip.x - poseWrist.x,
    y: handThumbTip.y - poseWrist.y,
  };

  const dot = ref.x * v.x + ref.y * v.y;
  const magRef = Math.sqrt(ref.x * ref.x + ref.y * ref.y);
  const magV = Math.sqrt(v.x * v.x + v.y * v.y);
  if (magRef === 0 || magV === 0) return 0;

  // Compute the unsigned angle between the vectors
  let angle = Math.acos(dot / (magRef * magV)) * (180 / Math.PI);

  // Compute the cross product to determine the sign
  const cross = ref.x * v.y - ref.y * v.x;
  angle = cross < 0 ? -angle : angle;

  const angleFix = angle.toFixed(2);

  return angleFix;

  // (Optional) You may clamp or adjust the angle range if needed.
  // return angleFix > 0 ? Math.abs(angleFix) : 0;
}
export const leftHandPronation = (positions) => {
  const [poseElbow, poseWrist, handThumbTip] = positions;
  const handVector = {
    x: handThumbTip.x - poseWrist.x,
    y: handThumbTip.y - poseWrist.y,
  };

  // Normalize vector
  const magHand = Math.sqrt(handVector.x ** 2 + handVector.y ** 2);
  if (magHand === 0) return 0; // Avoid division by zero

  // Dot product with vertical axis (reference is (0, -1))
  const dot = handVector.y / magHand; // Since ref is (0,-1), dot product simplifies to just `y/mag`

  // Compute angle in degrees
  let angle = Math.acos(dot) * (180 / Math.PI);

  // Determine direction using the x-component (left or right deviation)
  if (handVector.x > 0) angle = -angle;

  return angle.toFixed(2); /// Return absolute value of pronation
};

export const LumbarRotationLeft = (positions) => {
  const [leftShoulder, rightShoulder, leftHip, rightHip] = positions;

  // 1) Midpoint of hips (reference line)
  const midX = (leftHip.x + rightHip.x) / 2;
  const midY = (leftHip.y + rightHip.y) / 2;

  // 2) Midpoint of shoulders (moving point)
  const shoulderX = (leftShoulder.x + rightShoulder.x) / 2;
  const shoulderY = (leftShoulder.y + rightShoulder.y) / 2;

  // 3) Vector from hip midpoint to shoulder midpoint
  const dx = shoulderX - midX;
  const dy = shoulderY - midY;

  // 4) Compute angle in degrees relative to vertical
  let angle = Math.atan2(dy, dx) * (180 / Math.PI);

  // 5) Shift so that 0° = upright
  let angleFromVertical = angle + 90;

  // 6) Left rotation is negative, so we take only the negative portion
  let leftRotation = Math.max(0, -angleFromVertical);

  // 7) Round to 2 decimals
  return Math.round(leftRotation * 100) / 100;
};

/* STRAPI  */

const LumbarRightLateralFlexion = (positions) => {
  const [nose, leftHip, rightHip] = positions;

  const midX = (leftHip.x + rightHip.x) / 2;
  const midY = (leftHip.y + rightHip.y) / 2;

  const dx = nose.x - midX;
  const dy = nose.y - midY;

  let angle = Math.atan2(dy, dx) * (180 / Math.PI);
  let angleFromVertical = angle + 90;

  // Left flex is the positive portion of the negative side
  let leftFlex = Math.max(0, -angleFromVertical);

  return Math.round(leftFlex * 100) / 100;
};

const neckRightRotation = (positions) => {
  const [nose, leftShoulder, rightShoulder] = positions;

  // Midpoint between shoulders
  const midX = (leftShoulder.x + rightShoulder.x) / 2;
  const midY = (leftShoulder.y + rightShoulder.y) / 2;

  // Vector from shoulder-midpoint to nose
  const dx = nose.x - midX;
  const dy = nose.y - midY;

  // Angle in degrees from the +X axis
  let angle = Math.atan2(dy, dx) * (180 / Math.PI);

  // Shift so that 0° = upright
  let angleFromVertical = angle + 90;

  // Ensure positive rotation
  const neckRotation = angleFromVertical.toFixed(2);
  const rightRotation = neckRotation < 0 ? Math.abs(neckRotation) : 0;
  const leftRotation = neckRotation > 0 ? neckRotation : 0;
  return rightRotation * 2;
};

const NeckRighLateralFlexion = (positions) => {
  // Destructure the points you need.
  // Make sure positions is [nose, leftShoulder, rightShoulder, ...] in that order.
  const [nose, leftShoulder, rightShoulder] = positions;

  // 1) Midpoint of shoulders
  const midX = (leftShoulder.x + rightShoulder.x) / 2;
  const midY = (leftShoulder.y + rightShoulder.y) / 2;

  // 2) Vector from shoulder-midpoint to nose
  const dx = nose.x - midX;
  const dy = nose.y - midY;

  // 3) Angle in degrees from the +X axis
  let angle = Math.atan2(dy, dx) * (180 / Math.PI);

  // 4) Shift so that 0° = upright
  let angleFromVertical = angle + 90;

  // 5) Assign variable to rounded angle
  const roundedAngle = Math.round(angleFromVertical * 100) / 100;

  // 6) Check if angle is lesser than zero and return accordingly
  if (roundedAngle < 0) {
    return Math.abs(roundedAngle);
  } else {
    return 0;
  }
};

const LeftWristExtension = (positions) => {
  const [poseElbow, poseWrist, handIndexTip] = positions;
  const ref = { x: -1, y: 0 };
  const v = handIndexTip
    ? { x: handIndexTip.x - poseWrist.x, y: handIndexTip.y - poseWrist.y }
    : { x: 0, y: 0 };
  const dot = ref.x * v.x + ref.y * v.y;
  const magRef = Math.sqrt(ref.x * ref.x + ref.y * ref.y);
  const magV = Math.sqrt(v.x * v.x + v.y * v.y);
  if (magV === 0) return 0;
  let angle = Math.acos(dot / (magRef * magV)) * (180 / Math.PI);
  const cross = ref.x * v.y - ref.y * v.x;
  if (cross > 0) angle = -angle;
  return angle < 0 ? Math.abs(angle) : 0;
};

const LeftWristFlexion = (positions) => {
  const [poseElbow, poseWrist, handIndexTip] = positions;
  const ref = { x: -1, y: 0 };
  const v = handIndexTip
    ? { x: handIndexTip.x - poseWrist.x, y: handIndexTip.y - poseWrist.y }
    : { x: 0, y: 0 };
  const dot = ref.x * v.x + ref.y * v.y;
  const magRef = Math.sqrt(ref.x * ref.x + ref.y * ref.y);
  const magV = Math.sqrt(v.x * v.x + v.y * v.y);
  if (magV === 0) return 0;
  let angle = Math.acos(dot / (magRef * magV)) * (180 / Math.PI);
  const cross = ref.x * v.y - ref.y * v.x;
  if (cross > 0) angle = -angle;
  return angle > 0 ? angle : 0;
};

const RightWristSupination = (positions) => {
  const [poseElbow, poseWrist, handThumbTip] = positions;

  const ref = { x: 0, y: -1 };

  // Compute the vector from the wrist to the thumb tip.
  const v = {
    x: handThumbTip.x - poseWrist.x,
    y: handThumbTip.y - poseWrist.y,
  };

  const dot = ref.x * v.x + ref.y * v.y;
  const magRef = Math.sqrt(ref.x * ref.x + ref.y * ref.y);
  const magV = Math.sqrt(v.x * v.x + v.y * v.y);
  if (magRef === 0 || magV === 0) return 0;

  // Compute the unsigned angle between the vectors
  let angle = Math.acos(dot / (magRef * magV)) * (180 / Math.PI);

  // Compute the cross product to determine the sign
  const cross = ref.x * v.y - ref.y * v.x;
  angle = cross > 0 ? -angle : angle;

  const angleFix = angle.toFixed(2);

  // (Optional) You may clamp or adjust the angle range if needed.
  return angleFix > 0 ? Math.abs(angleFix) : 0;
};

const RightWristPronation = (positions) => {
  const [poseElbow, poseWrist, handThumbTip] = positions;
  const ref = { x: 0, y: -1 };

  // Compute the vector from the wrist to the thumb tip.
  const v = {
    x: handThumbTip.x - poseWrist.x,
    y: handThumbTip.y - poseWrist.y,
  };

  const dot = ref.x * v.x + ref.y * v.y;
  const magRef = Math.sqrt(ref.x * ref.x + ref.y * ref.y);
  const magV = Math.sqrt(v.x * v.x + v.y * v.y);
  if (magRef === 0 || magV === 0) return 0;

  // Compute the unsigned angle between the vectors
  let angle = Math.acos(dot / (magRef * magV)) * (180 / Math.PI);

  // Compute the cross product to determine the sign
  const cross = ref.x * v.y - ref.y * v.x;
  angle = cross > 0 ? -angle : angle;

  const angleFix = angle.toFixed(2);

  // (Optional) You may clamp or adjust the angle range if needed.
  return angleFix < 0 ? Math.abs(angleFix) : 0;
};

const RightWristRadialDeviation = (positions) => {
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
  return angle < 0 ? Math.abs(angle) : 0;
};

const RightWristUlnarDeviation = (positions) => {
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
  return angle > 0 ? angle : 0;
};

const LeftWristSupination = (positions) => {
  const [poseElbow, poseWrist, handThumbTip] = positions;

  const ref = { x: 0, y: -1 };

  // Compute the vector from the wrist to the thumb tip.
  const v = {
    x: handThumbTip.x - poseWrist.x,
    y: handThumbTip.y - poseWrist.y,
  };

  const dot = ref.x * v.x + ref.y * v.y;
  const magRef = Math.sqrt(ref.x * ref.x + ref.y * ref.y);
  const magV = Math.sqrt(v.x * v.x + v.y * v.y);
  if (magRef === 0 || magV === 0) return 0;

  // Compute the unsigned angle between the vectors
  let angle = Math.acos(dot / (magRef * magV)) * (180 / Math.PI);

  // Compute the cross product to determine the sign
  const cross = ref.x * v.y - ref.y * v.x;
  angle = cross < 0 ? -angle : angle;

  const angleFix = angle.toFixed(2);

  // (Optional) You may clamp or adjust the angle range if needed.
  return angleFix > 0 ? Math.abs(angleFix) : 0;
};

const LeftWristPronation = (positions) => {
  const [poseElbow, poseWrist, handThumbTip] = positions;
  const ref = { x: 0, y: -1 };

  // Compute the vector from the wrist to the thumb tip.
  const v = {
    x: handThumbTip.x - poseWrist.x,
    y: handThumbTip.y - poseWrist.y,
  };

  const dot = ref.x * v.x + ref.y * v.y;
  const magRef = Math.sqrt(ref.x * ref.x + ref.y * ref.y);
  const magV = Math.sqrt(v.x * v.x + v.y * v.y);
  if (magRef === 0 || magV === 0) return 0;

  // Compute the unsigned angle between the vectors
  let angle = Math.acos(dot / (magRef * magV)) * (180 / Math.PI);

  // Compute the cross product to determine the sign
  const cross = ref.x * v.y - ref.y * v.x;
  angle = cross < 0 ? -angle : angle;

  const angleFix = angle.toFixed(2);

  // (Optional) You may clamp or adjust the angle range if needed.
  return angleFix < 0 ? Math.abs(angleFix) : 0;
};
const LeftWristRadialDeviation = (positions) => {
  const [poseElbow, poseWrist, handMiddleFingerTip] = positions; // Extract parameters

  // Define a horizontal reference vector (pointing to the right).
  const ref = { x: -1, y: 0 };

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
  return angle > 0 ? Math.abs(angle) : 0;
};

const LeftWristUlnarDeviation = (positions) => {
  const [poseElbow, poseWrist, handMiddleFingerTip] = positions;
  const ref = { x: -1, y: 0 };
  const v = {
    x: handMiddleFingerTip.x - poseWrist.x,
    y: handMiddleFingerTip.y - poseWrist.y,
  };
  const dot = ref.x * v.x + ref.y * v.y;
  const magRef = Math.sqrt(ref.x ** 2 + ref.y ** 2);
  const magV = Math.sqrt(v.x ** 2 + v.y ** 2);
  if (magV === 0) return 0;
  let angle = Math.acos(dot / (magRef * magV)) * (180 / Math.PI);
  const cross = ref.x * v.y - ref.y * v.x;
  if (cross < 0) angle = -angle;
  return angle < 0 ? Math.abs(angle) : 0;
};

const NeckLeftLateralFlexion = (positions) => {
  // Destructure the points you need.
  // Make sure positions is [nose, leftShoulder, rightShoulder, ...] in that order.
  const [nose, leftShoulder, rightShoulder] = positions;

  // 1) Midpoint of shoulders
  const midX = (leftShoulder.x + rightShoulder.x) / 2;
  const midY = (leftShoulder.y + rightShoulder.y) / 2;

  // 2) Vector from shoulder-midpoint to nose
  const dx = nose.x - midX;
  const dy = nose.y - midY;

  // 3) Angle in degrees from the +X axis
  let angle = Math.atan2(dy, dx) * (180 / Math.PI);

  // 4) Shift so that 0° = upright
  let angleFromVertical = angle + 90;

  // 5) Assign variable to rounded angle
  const roundedAngle = (Math.round(angleFromVertical * 100) / 100) * 2.2;

  // 6) Check if angle is greater than zero and return accordingly
  return roundedAngle > 0 ? roundedAngle.toFixed(2) : 0;
};
const NeckRightLateralFlexion = (positions) => {
  // Destructure the points you need.
  const [p0, p1, p2] = positions;

  // 1) Midpoint of shoulders
  const midX = (p1.x + p2.x) / 2;
  const midY = (p1.y + p2.y) / 2;

  // 2) Vector from shoulder-midpoint to nose
  const dx = p0.x - midX;
  const dy = p0.y - midY;

  // 3) Angle in degrees from the +X axis
  let angle = Math.atan2(dy, dx) * (180 / Math.PI);

  // 4) Shift so that 0° = upright
  let angleFromVertical = angle + 90;

  // 5) Assign variable to rounded angle
  const roundedAngle = (Math.round(angleFromVertical * 100) / 100) * 2.2;

  // 6) Check if angle is lesser than zero and return accordingly
  return roundedAngle < 0 ? Math.abs(roundedAngle.toFixed(2)) : 0;
};

const RightWristExtension = (positions) => {
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
  return angle < 0 ? Math.abs(angle) : 0;
};

const RightWristFlexion = (positions) => {
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
  return angle > 0 ? angle : 0;
};
const LumbarLeftLateralFlexion = (positions) => {
  // Destructure the points you need.
  // Make sure positions is [nose, leftHip, rightHip, ...] in that order.
  const [nose, leftHip, rightHip] = positions;

  // 1) Midpoint of hips
  const midX = (leftHip.x + rightHip.x) / 2;
  const midY = (leftHip.y + rightHip.y) / 2;

  // 2) Vector from hip-midpoint to nose
  const dx = nose.x - midX;
  const dy = nose.y - midY;

  // 3) Angle in degrees from the +X axis
  let angle = Math.atan2(dy, dx) * (180 / Math.PI);

  // 4) Shift so that 0° = upright
  let angleFromVertical = angle + 90;

  // 5) Right flex is positive portion only
  let rightFlex = Math.max(0, angleFromVertical);

  // 6) Round to 2 decimals
  return Math.round(rightFlex * 100) / 100;
};

const NeckLeftRotation = (positions) => {
  const [nose, leftShoulder, rightShoulder] = positions;

  // Midpoint between shoulders
  const midX = (leftShoulder.x + rightShoulder.x) / 2;
  const midY = (leftShoulder.y + rightShoulder.y) / 2;

  // Vector from shoulder-midpoint to nose
  const dx = nose.x - midX;
  const dy = nose.y - midY;

  // Angle in degrees from the +X axis
  let angle = Math.atan2(dy, dx) * (180 / Math.PI);

  // Shift so that 0° = upright
  let angleFromVertical = angle + 90;

  // Ensure positive rotation
  const neckRotation = angleFromVertical.toFixed(2);
  const rightRotation = neckRotation < 0 ? Math.abs(neckRotation * 3.5) : 0;
  const leftRotation = neckRotation > 0 ? neckRotation * 4.2 : 0;
  return rightRotation.toFixed(2);
};

const NeckExtension = (positions) => {
  const [p0, p1, p2] = positions;
  const dx = p0.x - p1.x;
  const dy = p0.y - p1.y;
  let angle = Math.atan2(dy, dx) * (180 / Math.PI);
  let neckExtension = Math.max(0, 90 - Math.abs(angle));
  const roundedAngle = Math.round(neckExtension * 100) / 100;
  return (roundedAngle * 2.5).toFixed(2);
};

const LumbarLeftExtension = (positions) => {
  const [p0, p1, p2] = positions;
  const a = Math.pow(p1.x - p0.x, 2) + Math.pow(p1.y - p0.y, 2);
  const b = Math.pow(p2.x - p0.x, 2) + Math.pow(p2.y - p0.y, 2);
  const c = Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2);

  let angle = Math.acos((a + b - c) / Math.sqrt(4 * a * b)) * (180 / Math.PI);

  // Ensure 0° when standing straight and increase with backward bending
  angle = Math.abs(180 - angle);
  const lumbarExtension = (Math.round(angle * 100) / 100) * 1.3;
  return lumbarExtension.toFixed(2);
};
const LumbarLeftRotation = (positions) => {
  // Assuming landmarks are provided by MediaPipe Pose in normalized coordinates

  const [p0, p1, p2, p3] = positions;

  // Compute midpoints for hips and shoulders
  const hipCenter = {
    x: (p0.x + p1.x) / 2,
    y: (p0.y + p1.y) / 2,
  };

  const shoulderCenter = {
    x: (p2.x + p3.x) / 2,
    y: (p2.y + p3.y) / 2,
  };

  // Compute torso vector (from hip center to shoulder center)
  const v = {
    x: shoulderCenter.x - hipCenter.x,
    y: shoulderCenter.y - hipCenter.y,
  };

  // Define vertical reference vector (pointing straight up)
  const ref = { x: 0, y: -1 };

  // Calculate dot product and magnitudes
  const dot = ref.x * v.x + ref.y * v.y;
  const magRef = Math.sqrt(ref.x ** 2 + ref.y ** 2);
  const magV = Math.sqrt(v.x ** 2 + v.y ** 2);

  if (magV === 0) return '0.00'; // Avoid division by zero

  // Calculate angle using acos (in degrees)
  let angle = Math.acos(dot / (magRef * magV)) * (180 / Math.PI);

  // Determine sign using cross product
  const cross = ref.x * v.y - ref.y * v.x;
  if (cross < 0) angle = -angle;
  const angleFix = (angle * 10).toFixed(2);

  return angleFix < 0 ? Math.abs(angleFix) : 0;
};
const LumbarRightRotation = (positions) => {
  const [p0, p1, p2, p3] = positions;

  // Compute midpoints for hips and shoulders
  const hipCenter = {
    x: (p0.x + p1.x) / 2,
    y: (p0.y + p1.y) / 2,
  };

  const shoulderCenter = {
    x: (p2.x + p3.x) / 2,
    y: (p2.y + p3.y) / 2,
  };

  // Compute torso vector (from hip center to shoulder center)
  const v = {
    x: shoulderCenter.x - hipCenter.x,
    y: shoulderCenter.y - hipCenter.y,
  };

  // Define vertical reference vector (pointing straight up)
  const ref = { x: 0, y: -1 };

  // Calculate dot product and magnitudes
  const dot = ref.x * v.x + ref.y * v.y;
  const magRef = Math.sqrt(ref.x ** 2 + ref.y ** 2);
  const magV = Math.sqrt(v.x ** 2 + v.y ** 2);

  if (magV === 0) return '0.00'; // Avoid division by zero

  // Calculate angle using acos (in degrees)
  let angle = Math.acos(dot / (magRef * magV)) * (180 / Math.PI);

  // Determine sign using cross product
  const cross = ref.x * v.y - ref.y * v.x;
  if (cross < 0) angle = -angle;
  const angleFix = (angle * 10).toFixed(2);

  return angleFix > 0 ? (angleFix / 1.4).toFixed(2) : 0;
};

export {
  NeckExtension,
  NeckLeftLateralFlexion,
  NeckRightLateralFlexion,
  NeckLeftRotation,
  LumbarLeftExtension,
  LumbarLeftRotation,
  LumbarRightRotation,
};
