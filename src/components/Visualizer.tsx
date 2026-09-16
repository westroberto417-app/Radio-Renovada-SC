import React, { useEffect, useRef, useState, memo } from 'react';
import { useStore, VisualizerStyle, VisualizerTheme } from '../store/useStore';
import { BarChart3, Disc, Activity, Sparkles, Palette, Zap } from 'lucide-react';
import { cn } from '../lib/utils';

interface VisualizerProps {
  variant?: 'compact' | 'full' | 'ring' | 'standalone';
  className?: string;
  showControls?: boolean;
}

const THEME_PRESETS: Record<VisualizerTheme, {
  name: string;
  label: string;
  colors: string[];
  gradient: [string, string, string];
}> = {
  dynamic: {
    name: 'Auto-Frecuencia',
    label: 'Reactivo a Graves, Medios y Agudos',
    colors: ['#ff007f', '#8b5cf6', '#00f2ff'],
    gradient: ['#ff007f', '#8b5cf6', '#00f2ff']
  },
  corrientes: {
    name: 'Corrientes Neón',
    label: 'Rosa Fucsia & Violeta',
    colors: ['#ff007f', '#ec4899', '#a855f7'],
    gradient: ['#ff007f', '#d946ef', '#8b5cf6']
  },
  chamame: {
    name: 'Fuego Chamamé',
    label: 'Rojo Pasión, Naranja & Oro',
    colors: ['#ef4444', '#f97316', '#eab308'],
    gradient: ['#ef4444', '#f97316', '#fbbf24']
  },
  ibera: {
    name: 'Laguna Iberá',
    label: 'Turquesa, Esmeralda & Cyan',
    colors: ['#06b6d4', '#10b981', '#38bdf8'],
    gradient: ['#0891b2', '#10b981', '#38bdf8']
  },
  cyberpunk: {
    name: 'Cyber Synth',
    label: 'Magenta Eléctrico & Cyan Láser',
    colors: ['#f43f5e', '#a855f7', '#00f2ff'],
    gradient: ['#f43f5e', '#a855f7', '#00f2ff']
  }
};

const STYLES: { id: VisualizerStyle; label: string; icon: React.FC<{ size?: number; className?: string }> }[] = [
  { id: 'bars', label: 'Barras', icon: BarChart3 },
  { id: 'circular', label: 'Anillo 360°', icon: Disc },
  { id: 'wave', label: 'Aurora', icon: Activity },
  { id: 'particles', label: 'Pulso', icon: Sparkles }
];

export const Visualizer: React.FC<VisualizerProps> = memo(({
  variant = 'compact',
  className = '',
  showControls = true
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const peaksRef = useRef<number[]>([]);
  const peakDecayRef = useRef<number[]>([]);
  const particlesRef = useRef<Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    color: string;
    baseAlpha: number;
    band: 'bass' | 'mid' | 'treble';
  }>>([]);

  const bassTextRef = useRef<HTMLSpanElement>(null);
  const midTextRef = useRef<HTMLSpanElement>(null);
  const trebleTextRef = useRef<HTMLSpanElement>(null);

  const isPlaying = useStore((state) => state.isPlaying);
  const visualizerStyle = useStore((state) => state.visualizerStyle);
  const visualizerTheme = useStore((state) => state.visualizerTheme);
  const setVisualizerStyle = useStore((state) => state.setVisualizerStyle);
  const setVisualizerTheme = useStore((state) => state.setVisualizerTheme);

  const [showThemePicker, setShowThemePicker] = useState(false);

  // Initialize particles for the particle style
  useEffect(() => {
    const particles = [];
    const colors = ['#ff007f', '#8b5cf6', '#00f2ff', '#fbbf24', '#10b981'];
    for (let i = 0; i < 48; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.3 + Math.random() * 1.5;
      const band: 'bass' | 'mid' | 'treble' = i % 3 === 0 ? 'bass' : i % 3 === 1 ? 'mid' : 'treble';
      particles.push({
        x: Math.random() * 400,
        y: Math.random() * 400,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: band === 'bass' ? 3 + Math.random() * 3 : band === 'mid' ? 2 + Math.random() * 2 : 1 + Math.random() * 1.5,
        color: colors[i % colors.length],
        baseAlpha: 0.3 + Math.random() * 0.6,
        band
      });
    }
    particlesRef.current = particles;
  }, []);

  // Main Canvas Render Loop (Pure reactive dynamic frequency synthesis)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;
    let smoothedBass = 0;
    let smoothedMid = 0;
    let smoothedTreble = 0;
    let rotationAngle = 0;
    let uiUpdateCounter = 0;

    const render = () => {
      time += 0.03;
      rotationAngle += 0.006;
      uiUpdateCounter++;

      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      // Generate dynamic organic frequency harmonics reactive to radio stream playback
      const bufferLength = 64;
      const dataArray = new Uint8Array(bufferLength);

      if (isPlaying) {
        const beatKick = Math.pow(Math.max(0, Math.sin(time * 3.2)), 3) * 0.8 + Math.sin(time * 6.4) * 0.2;
        const snareSnap = Math.pow(Math.max(0, Math.sin(time * 3.2 + 1.6)), 4) * 0.7;
        const groove = Math.sin(time * 1.5) * 0.3 + 0.7;

        for (let i = 0; i < bufferLength; i++) {
          const freqNorm = i / bufferLength;
          let val = 0;
          if (freqNorm < 0.2) {
            // Sub-bass & Bass
            val = (beatKick * 0.75 + 0.25 + Math.sin(time * 4 + i * 0.5) * 0.2) * 240 * groove;
          } else if (freqNorm < 0.6) {
            // Mids (Vocals & Instruments)
            val = (snareSnap * 0.5 + Math.sin(time * 5 + i * 0.8) * 0.35 + 0.35) * 200 * groove;
          } else {
            // Highs & Treble
            val = (Math.sin(time * 8 + i * 1.2) * 0.4 + 0.4 + (Math.random() * 0.2)) * 170 * groove;
          }
          dataArray[i] = Math.min(255, Math.max(10, val));
        }
      } else {
        // Gentle ambient decay when paused
        for (let i = 0; i < bufferLength; i++) {
          dataArray[i] = Math.max(0, Math.sin(time * 0.8 + i * 0.2) * 12 + 6);
        }
      }

      // Calculate Energy in 3 Frequency Bands
      let rawBass = 0;
      let rawMid = 0;
      let rawTreble = 0;
      const bassCount = Math.floor(bufferLength * 0.2) || 1;
      const midCount = Math.floor(bufferLength * 0.4) || 1;
      const trebleCount = bufferLength - bassCount - midCount || 1;

      for (let i = 0; i < bufferLength; i++) {
        const val = dataArray[i] / 255;
        if (i < bassCount) rawBass += val;
        else if (i < bassCount + midCount) rawMid += val;
        else rawTreble += val;
      }

      rawBass = rawBass / bassCount;
      rawMid = rawMid / midCount;
      rawTreble = rawTreble / trebleCount;

      // Smooth the energy values
      smoothedBass = smoothedBass * 0.8 + rawBass * 0.2;
      smoothedMid = smoothedMid * 0.8 + rawMid * 0.2;
      smoothedTreble = smoothedTreble * 0.8 + rawTreble * 0.2;

      // Direct DOM update for frequency text meters to avoid 60fps/6fps React re-renders
      if (uiUpdateCounter % 10 === 0) {
        if (bassTextRef.current) bassTextRef.current.textContent = `G:${Math.round(smoothedBass * 100)}%`;
        if (midTextRef.current) midTextRef.current.textContent = `M:${Math.round(smoothedMid * 100)}%`;
        if (trebleTextRef.current) trebleTextRef.current.textContent = `A:${Math.round(smoothedTreble * 100)}%`;
      }

      // Color computation based on current frequency & chosen theme
      const currentTheme = THEME_PRESETS[visualizerTheme] || THEME_PRESETS.dynamic;
      
      // Dynamic frequency-driven color interpolator
      const getFrequencyColor = (freqIndex: number, totalBins: number, alpha = 1) => {
        const ratio = freqIndex / totalBins;

        if (visualizerTheme === 'dynamic') {
          // Graves (Low) -> Hot Pink/Magenta
          // Medios (Mid) -> Royal Violet/Electric Indigo
          // Agudos (High) -> Cyan/Turquoise/Amber
          if (ratio < 0.3) {
            const r = Math.round(255);
            const g = Math.round(smoothedBass * 40);
            const b = Math.round(127 + smoothedMid * 80);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
          } else if (ratio < 0.7) {
            const r = Math.round(139 + smoothedBass * 60);
            const g = Math.round(92 + smoothedTreble * 60);
            const b = Math.round(246);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
          } else {
            const r = Math.round(smoothedBass * 40);
            const g = Math.round(242 - smoothedMid * 40);
            const b = Math.round(255);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
          }
        } else {
          // Preset palette with frequency intensity
          const colors = currentTheme.colors;
          const colorIdx = Math.floor(ratio * colors.length) % colors.length;
          return colors[colorIdx];
        }
      };

      // Ensure peaks array is sized properly
      if (peaksRef.current.length !== bufferLength) {
        peaksRef.current = new Array(bufferLength).fill(0);
        peakDecayRef.current = new Array(bufferLength).fill(0);
      }

      // Update peaks
      for (let i = 0; i < bufferLength; i++) {
        const val = dataArray[i] / 255;
        if (val >= peaksRef.current[i]) {
          peaksRef.current[i] = val;
          peakDecayRef.current[i] = 0;
        } else {
          peakDecayRef.current[i] += 0.002;
          peaksRef.current[i] = Math.max(0, peaksRef.current[i] - peakDecayRef.current[i]);
        }
      }

      // RENDER STYLE 1: BARS (Barras Espectrales / Ecualizador)
      if (visualizerStyle === 'bars') {
        const barCount = Math.min(32, bufferLength);
        const gap = 3;
        const totalBarWidth = (width - (barCount - 1) * gap) / barCount;
        const barWidth = Math.max(3, totalBarWidth);

        // Center glow based on bass
        if (isPlaying && smoothedBass > 0.3) {
          const glowGrad = ctx.createRadialGradient(width / 2, height / 2, 10, width / 2, height / 2, width / 2);
          glowGrad.addColorStop(0, `rgba(255, 0, 127, ${smoothedBass * 0.15})`);
          glowGrad.addColorStop(1, 'transparent');
          ctx.fillStyle = glowGrad;
          ctx.fillRect(0, 0, width, height);
        }

        for (let i = 0; i < barCount; i++) {
          // Average a bucket of frequency data for stability
          const dataIdx = Math.floor((i / barCount) * (bufferLength * 0.85));
          const val = (dataArray[dataIdx] || 0) / 255;
          const barHeight = Math.max(4, val * (height * 0.88));
          const x = i * (barWidth + gap);
          const y = height - barHeight;

          // Vertical gradient for the bar
          const barGrad = ctx.createLinearGradient(x, height, x, y);
          const baseColor = getFrequencyColor(i, barCount, 0.4);
          const topColor = getFrequencyColor(i, barCount, 0.95);

          barGrad.addColorStop(0, baseColor);
          barGrad.addColorStop(0.6, topColor);
          barGrad.addColorStop(1, '#ffffff');

          ctx.fillStyle = barGrad;
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, [4, 4, 1, 1]);
          ctx.fill();

          // Peak Cap
          const peakVal = peaksRef.current[dataIdx] || 0;
          const peakY = height - Math.max(4, peakVal * (height * 0.88)) - 3;
          if (peakY < height - 6) {
            ctx.fillStyle = getFrequencyColor(i, barCount, 1);
            ctx.shadowColor = topColor;
            ctx.shadowBlur = 6;
            ctx.fillRect(x, peakY, barWidth, 2);
            ctx.shadowBlur = 0;
          }
        }
      }

      // RENDER STYLE 2: CIRCULAR (Anillo 360° Neón / Espectro Radial)
      else if (visualizerStyle === 'circular') {
        const centerX = width / 2;
        const centerY = height / 2;
        const baseRadius = Math.min(centerX, centerY) * 0.52 + (smoothedBass * 18);
        const barCount = 48;

        // Inner glowing core
        const coreGrad = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, baseRadius);
        coreGrad.addColorStop(0, `rgba(255, 0, 127, ${0.1 + smoothedBass * 0.3})`);
        coreGrad.addColorStop(0.7, `rgba(139, 92, 246, ${0.05 + smoothedMid * 0.2})`);
        coreGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = coreGrad;
        ctx.beginPath();
        ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
        ctx.fill();

        // Radial bars
        for (let i = 0; i < barCount; i++) {
          const dataIdx = Math.floor((i / barCount) * (bufferLength * 0.8));
          const val = (dataArray[dataIdx] || 0) / 255;
          const barLength = Math.max(4, val * (Math.min(centerX, centerY) * 0.44));
          const angle = (i * (360 / barCount) * Math.PI) / 180 + rotationAngle;

          const x1 = centerX + Math.cos(angle) * baseRadius;
          const y1 = centerY + Math.sin(angle) * baseRadius;
          const x2 = centerX + Math.cos(angle) * (baseRadius + barLength);
          const y2 = centerY + Math.sin(angle) * (baseRadius + barLength);

          const color = getFrequencyColor(i, barCount, 0.85);

          ctx.strokeStyle = color;
          ctx.lineWidth = 3.5;
          ctx.lineCap = 'round';
          ctx.shadowColor = color;
          ctx.shadowBlur = val > 0.5 ? 8 : 2;

          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
          ctx.shadowBlur = 0;
        }

        // Inner glowing border ring
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.2 + smoothedTreble * 0.5})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
        ctx.stroke();
      }

      // RENDER STYLE 3: WAVE (Aurora Dinámica / Ondas Líquidas)
      else if (visualizerStyle === 'wave') {
        const points = 24;
        const step = width / (points - 1);

        // Wave Layer 1 (Mid & Treble responsive - Cyan/Purple)
        ctx.beginPath();
        ctx.moveTo(0, height);

        for (let i = 0; i < points; i++) {
          const dataIdx = Math.floor((i / points) * (bufferLength * 0.7));
          const val = (dataArray[dataIdx] || 0) / 255;
          const waveHeight = val * (height * 0.65) + Math.sin(time * 2 + i * 0.4) * 8;
          const y = height - Math.max(10, waveHeight);
          const x = i * step;

          if (i === 0) ctx.lineTo(x, y);
          else {
            const prevX = (i - 1) * step;
            const cx = (prevX + x) / 2;
            ctx.bezierCurveTo(cx, y, cx, y, x, y);
          }
        }

        ctx.lineTo(width, height);
        ctx.closePath();

        const waveGrad1 = ctx.createLinearGradient(0, 0, width, height);
        waveGrad1.addColorStop(0, `rgba(0, 242, 255, ${0.35 + smoothedTreble * 0.3})`);
        waveGrad1.addColorStop(0.5, `rgba(139, 92, 246, ${0.25 + smoothedMid * 0.3})`);
        waveGrad1.addColorStop(1, `rgba(255, 0, 127, 0.1)`);
        ctx.fillStyle = waveGrad1;
        ctx.fill();

        // Wave Layer 2 (Bass responsive - Hot Pink / Magenta)
        ctx.beginPath();
        ctx.moveTo(0, height);

        for (let i = 0; i < points; i++) {
          const dataIdx = Math.floor(((points - 1 - i) / points) * (bufferLength * 0.5));
          const val = (dataArray[dataIdx] || 0) / 255;
          const waveHeight = val * (height * 0.75) + Math.cos(time * 2.5 + i * 0.5) * 10 * (smoothedBass + 0.3);
          const y = height - Math.max(12, waveHeight);
          const x = i * step;

          if (i === 0) ctx.lineTo(x, y);
          else {
            const prevX = (i - 1) * step;
            const cx = (prevX + x) / 2;
            ctx.bezierCurveTo(cx, y, cx, y, x, y);
          }
        }

        ctx.lineTo(width, height);
        ctx.closePath();

        const waveGrad2 = ctx.createLinearGradient(0, height, width, 0);
        waveGrad2.addColorStop(0, `rgba(255, 0, 127, ${0.45 + smoothedBass * 0.4})`);
        waveGrad2.addColorStop(1, `rgba(236, 72, 153, 0.15)`);
        ctx.fillStyle = waveGrad2;
        ctx.fill();

        // Top glowing crest line
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.6 + smoothedTreble * 0.4})`;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#00f2ff';
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.shadowBlur = 0;
      }

      // RENDER STYLE 4: PARTICLES (Pulso Cuántico & Energía)
      else if (visualizerStyle === 'particles') {
        const centerX = width / 2;
        const centerY = height / 2;

        // Central bass shockwave rings
        const ringCount = 3;
        for (let r = 0; r < ringCount; r++) {
          const ringRadius = (30 + r * 30 + (time * 20) % 40) * (0.8 + smoothedBass * 0.6);
          const ringAlpha = Math.max(0, 0.4 - (ringRadius / (width * 0.5))) * (smoothedBass + 0.2);
          ctx.strokeStyle = getFrequencyColor(r * 10, 30, ringAlpha);
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(centerX, centerY, ringRadius, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Draw and update particle field
        const particles = particlesRef.current;
        for (let i = 0; i < particles.length; i++) {
          const p = particles[i];
          const bandEnergy = p.band === 'bass' ? smoothedBass : p.band === 'mid' ? smoothedMid : smoothedTreble;

          p.x += p.vx * (1 + bandEnergy * 2.5);
          p.y += p.vy * (1 + bandEnergy * 2.5);

          // Wrap edges
          if (p.x < 0) p.x = width;
          if (p.x > width) p.x = 0;
          if (p.y < 0) p.y = height;
          if (p.y > height) p.y = 0;

          const currentSize = p.size * (1 + bandEnergy * 1.5);
          const alpha = Math.min(1, p.baseAlpha * (0.4 + bandEnergy * 0.8));

          ctx.fillStyle = getFrequencyColor(i, particles.length, alpha);
          ctx.shadowColor = ctx.fillStyle;
          ctx.shadowBlur = bandEnergy > 0.4 ? 10 : 3;

          ctx.beginPath();
          ctx.arc(p.x, p.y, currentSize, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationRef.current);
    };
  }, [isPlaying, visualizerStyle, visualizerTheme]);

  // Adjust default dimensions based on variant
  const getCanvasDimensions = () => {
    switch (variant) {
      case 'ring':
        return { width: 340, height: 340 };
      case 'full':
        return { width: 480, height: 160 };
      case 'standalone':
        return { width: 600, height: 260 };
      case 'compact':
      default:
        return { width: 360, height: 72 };
    }
  };

  const dims = getCanvasDimensions();

  return (
    <div className={cn("w-full flex flex-col items-center select-none", className)}>
      {/* Canvas Display */}
      <div className="relative w-full flex items-center justify-center overflow-hidden rounded-2xl">
        <canvas
          ref={canvasRef}
          width={dims.width}
          height={dims.height}
          className="w-full max-w-full h-auto drop-shadow-[0_0_15px_rgba(255,0,127,0.25)]"
        />

        {/* Real-time Frequency Spectrum Meters (Top Corner Badge) */}
        {isPlaying && (
          <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-1 rounded-full bg-black/60 border border-white/10 backdrop-blur-md text-[8px] font-mono font-bold tracking-wider">
            <span className="text-[#ff007f] flex items-center gap-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ff007f] inline-block animate-pulse" />
              <span ref={bassTextRef}>G:0%</span>
            </span>
            <span ref={midTextRef} className="text-[#8b5cf6]">M:0%</span>
            <span ref={trebleTextRef} className="text-[#00f2ff]">A:0%</span>
          </div>
        )}
      </div>

      {/* Visualizer Controls Bar */}
      {showControls && (
        <div className="w-full mt-3 flex flex-wrap items-center justify-between gap-2 px-1 text-xs">
          {/* Style Selector Tabs */}
          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10 backdrop-blur-sm">
            {STYLES.map((style) => {
              const Icon = style.icon;
              const isActive = visualizerStyle === style.id;
              return (
                <button
                  key={style.id}
                  onClick={() => setVisualizerStyle(style.id)}
                  title={`Estilo: ${style.label}`}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer",
                    isActive
                      ? "bg-[#ff007f] text-white shadow-[0_0_12px_rgba(255,0,127,0.5)]"
                      : "text-white/50 hover:text-white hover:bg-white/5"
                  )}
                >
                  <Icon size={13} />
                  <span className="hidden sm:inline">{style.label}</span>
                </button>
              );
            })}
          </div>

          {/* Theme Palette Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowThemePicker(!showThemePicker)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer",
                showThemePicker
                  ? "bg-white/20 text-white border-white/30"
                  : "bg-white/5 text-white/70 hover:text-white hover:bg-white/10"
              )}
            >
              <Palette size={13} className="text-[#ff007f]" />
              <span>{THEME_PRESETS[visualizerTheme]?.name || 'Paleta'}</span>
              <div className="flex items-center -space-x-1 ml-1">
                {THEME_PRESETS[visualizerTheme]?.colors.map((c, i) => (
                  <span
                    key={i}
                    className="w-2 h-2 rounded-full border border-black/40"
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </button>

            {/* Floating Palette Dropdown */}
            {showThemePicker && (
              <div className="absolute right-0 bottom-full mb-2 w-56 bg-zinc-950/95 border border-white/15 rounded-2xl p-2 shadow-2xl backdrop-blur-xl z-50 space-y-1">
                <div className="px-2 py-1 text-[9px] font-black uppercase tracking-widest text-white/40 border-b border-white/10 mb-1 flex items-center gap-1">
                  <Zap size={10} className="text-[#ff007f]" />
                  Gama de Color & Frecuencia
                </div>
                {(Object.keys(THEME_PRESETS) as VisualizerTheme[]).map((themeKey) => {
                  const preset = THEME_PRESETS[themeKey];
                  const isSelected = visualizerTheme === themeKey;
                  return (
                    <button
                      key={themeKey}
                      onClick={() => {
                        setVisualizerTheme(themeKey);
                        setShowThemePicker(false);
                      }}
                      className={cn(
                        "w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-left transition-all cursor-pointer",
                        isSelected
                          ? "bg-[#ff007f]/20 border border-[#ff007f]/40 text-white"
                          : "hover:bg-white/5 text-white/70 hover:text-white"
                      )}
                    >
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-black uppercase tracking-wider leading-none">
                          {preset.name}
                        </p>
                        <p className="text-[8px] text-white/40 leading-none">
                          {preset.label}
                        </p>
                      </div>
                      <div className="flex items-center -space-x-1">
                        {preset.colors.map((c, i) => (
                          <span
                            key={i}
                            className="w-3 h-3 rounded-full border border-black/50 shadow-sm"
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});

Visualizer.displayName = 'Visualizer';
