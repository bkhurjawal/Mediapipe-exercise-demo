import React, { useState, useEffect, useRef } from 'react';
import { useSpeechSynthesis } from 'react-speech-kit';

const PostureAudioGuide = () => {
  const { speak, speaking, cancel, voices } = useSpeechSynthesis();
  const [step, setStep] = useState(0);
  const [manuallyStopped, setManuallyStopped] = useState(false);
  const [voice, setVoice] = useState(voices[6]);

  const instructions = [
    "Welcome to the Let’s Move program for early knee care! You’ve taken the first step by showing up.  Now I want you to set a goal to complete this 6-week movement intervention program.",
    "Please stand straight facing the camera.",
    "Now raise your right arm.",
    "Hold the position for five seconds.",
    "Scan complete. Thank you!",
  ];

  useEffect(() => {
    if (step < instructions.length && !speaking && !manuallyStopped) {
      const instruction = instructions[step];
      speak({ text: instruction, voice, rate: 1.2, pitch: 1.0 });
    }
  }, [step, speaking, voice, speak, manuallyStopped]);
    const stop = () => {
    cancel();
    setManuallyStopped(true); // Set flag to stop useEffect loop
  };

  const nextInstruction = () => {
    setManuallyStopped(false); // Reset manual stop when going to next step
    if (step < instructions.length - 1) {
      setStep(prev => prev + 1);
    } else {
      speak({ text: "All steps completed.", voice, onend: () => stop() });
    }
  };

  const reset = () => {
    cancel();
    setStep(0);
    setManuallyStopped(false); // Reset the flag on reset
  };



  return (
    <div style={{ padding: 20 }}>
      <h2>Posture Scan Audio Guide</h2>
      <p>Current Step: {step + 1} / {instructions.length}</p>
      <p><strong>Instruction:</strong> {instructions[step]}</p>

      <button onClick={nextInstruction}>
        {step === instructions.length - 1 ? 'Finish' : 'Next'}
      </button>
      <button onClick={reset} style={{ marginLeft: 10 }}>
        Reset
      </button>
      <button onClick={stop} style={{ marginLeft: 10 }}>
        Stop
      </button>
      <button onClick={()=>{setVoice((prev) => voices[prev + 1])}} style={{ marginLeft: 10 }}>
        Change Voice
      </button>
    </div>
  );
};

export default PostureAudioGuide;
