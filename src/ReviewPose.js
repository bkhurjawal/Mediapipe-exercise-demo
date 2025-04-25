import React, { useState } from 'react';
import PoseKeypointOverlay from './PoseKeypointOverlay';
import landmarksData from './landmarks.json'; // Replace with your actual landmark data

const PoseReview = () => {
  const [imageDataURL, setImageDataURL] = useState(null);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      setImageDataURL(e.target.result); // base64 image data
    };
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <h2>Pose Review</h2>

      <input
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        style={{ marginBottom: 20 }}
      />

      {imageDataURL ? (
        <PoseKeypointOverlay
          imageDataURL={imageDataURL}
          landmarks={landmarksData}
        />
      ) : (
        <p>Select an image to display pose keypoints.</p>
      )}
    </div>
  );
};

export default PoseReview;
