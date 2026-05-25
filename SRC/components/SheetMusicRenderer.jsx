import React, { useState, useEffect, useRef } from 'react';

const frequencyToNote = (frequency) => {
  const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  if (!frequency || frequency < 16.35) return null;
  const noteNum = 12 * (Math.log2(frequency / 16.35));
  const rounded = Math.round(noteNum);
  return { note: NOTE_NAMES[rounded % 12], octave: Math.floor(rounded / 12) };
};

export const AudioPitchEngine = ({ onNoteDetected, isListening, setIsListening }) => {
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const isListeningRef = useRef(isListening);

  useEffect(() => {
    isListeningRef.current = isListening;
    if (isListening) {
      startAudio();
    } else {
      stopAudio();
    }
    return () => stopAudio();
  }, [isListening]);

  const startAudio = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 2048;
      detect();
    } catch (err) {
      alert("נא לאשר גישה למיקרופון בדפדפן");
      setIsListening(false);
    }
  };

  const stopAudio = () => {
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (audioContextRef.current) audioContextRef.current.close();
  };

  const detect = () => {
    if (!isListeningRef.current || !analyserRef.current) return;
    const bufferLength = analyserRef.current.fftSize;
    const dataArray = new Float32Array(bufferLength);
    analyserRef.current.getFloatTimeDomainData(dataArray);

    let r = new Float32Array(bufferLength);
    for (let lag = 0; lag < bufferLength / 2; lag++) {
      let sum = 0;
      for (let i = 0; i < bufferLength / 2; i++) {
        sum += dataArray[i] * dataArray[i + lag];
      }
      r[lag] = sum;
    }

    let maxVal = -1, maxLag = -1;
    for (let lag = 20; lag < bufferLength / 2; lag++) {
      if (r[lag] > maxVal && r[lag] > r[lag - 1] && r[lag] > r[lag + 1]) {
        maxVal = r[lag]; maxLag = lag; break;
      }
    }

    if (maxLag > -1) {
      const freq = audioContextRef.current.sampleRate / maxLag;
      if (freq > 60 && freq < 1600) {
        const noteInfo = frequencyToNote(freq);
        if (noteInfo) onNoteDetected(noteInfo);
      }
    }
    animationFrameRef.current = requestAnimationFrame(detect);
  };

  return null;
};
