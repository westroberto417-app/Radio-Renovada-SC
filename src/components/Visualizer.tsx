import React, { useEffect, useRef } from 'react';

export const Visualizer = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const initAudio = () => {
      const audio = document.querySelector('audio');
      if (!audio) return;

      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        analyserRef.current = audioCtxRef.current.createAnalyser();
        const source = audioCtxRef.current.createMediaElementSource(audio);
        source.connect(analyserRef.current);
        analyserRef.current.connect(audioCtxRef.current.destination);
        analyserRef.current.fftSize = 256;
      }

      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
    };

    const draw = () => {
      if (!analyserRef.current || !ctx) return;

      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyserRef.current.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      const radius = Math.min(centerX, centerY) * 0.7;

      // Draw bars in a circle
      const barCount = 64;
      for (let i = 0; i < barCount; i++) {
        const value = dataArray[i];
        const percent = value / 255;
        const barHeight = percent * 60;
        const angle = (i * (360 / barCount) * Math.PI) / 180;

        const x1 = centerX + Math.cos(angle) * radius;
        const y1 = centerY + Math.sin(angle) * radius;
        const x2 = centerX + Math.cos(angle) * (radius + barHeight);
        const y2 = centerY + Math.sin(angle) * (radius + barHeight);

        ctx.strokeStyle = `rgba(255, 0, 127, ${0.4 + percent * 0.6})`;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    // Initialize on first click if needed (browser restriction)
    const handleGesture = () => {
      initAudio();
      draw();
      window.removeEventListener('click', handleGesture);
    };
    window.addEventListener('click', handleGesture);

    return () => {
      cancelAnimationFrame(animationRef.current);
      window.removeEventListener('click', handleGesture);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      width={320} 
      height={320} 
      className="w-full h-full max-w-[320px] max-h-[320px]"
    />
  );
};
