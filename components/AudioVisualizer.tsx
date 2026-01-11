
import React, { useEffect, useRef } from 'react';

interface AudioVisualizerProps {
  isPlaying: boolean;
}

export const AudioVisualizer: React.FC<AudioVisualizerProps> = ({ isPlaying }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    const bars = 30;
    const barWidth = canvas.width / bars;
    
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      for (let i = 0; i < bars; i++) {
        // Generate random height if playing, else flat line
        const height = isPlaying 
          ? Math.random() * canvas.height * 0.8 + 5 
          : 4;
        
        const x = i * barWidth;
        const y = (canvas.height - height) / 2;
        
        ctx.fillStyle = isPlaying ? '#6366f1' : '#cbd5e1'; // Indigo-500 vs Slate-300
        ctx.beginPath();
        ctx.roundRect(x + 2, y, barWidth - 4, height, 4);
        ctx.fill();
      }
      
      if (isPlaying) {
        animationId = requestAnimationFrame(draw);
      }
    };

    draw();

    return () => cancelAnimationFrame(animationId);
  }, [isPlaying]);

  return (
    <canvas 
      ref={canvasRef} 
      width={300} 
      height={60} 
      className="w-full h-[40px] sm:h-[60px]"
    />
  );
};
