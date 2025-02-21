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

export const calculateLumbarRotation = (
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
    // y: 1 - handThumbTip.y - poseWrist.y, // invert y for hand landmark
  };

  // Calculate the signed angle between the vertical reference and the vector.
  const angle = signedAngle(ref, v);

  console.log('angle', angle);
  console.log('v', v);
  console.log('handThumbTip', handThumbTip);
  const angleFix = angle - 20.0;

  // (Optional) You may clamp or adjust the angle range if needed.
  return angleFix.toFixed(2);
}
