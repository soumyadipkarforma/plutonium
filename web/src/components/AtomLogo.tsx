/**
 * AtomLogo – SVG atom with three animated orbital rings and a glowing nucleus.
 * Uses direct animate/transition props (not variants) to avoid FM12 type issues.
 */
import { motion } from 'framer-motion';

export default function AtomLogo({ size = 56 }: { size?: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const r  = size * 0.38;

  const ring = (duration: number, reverse = false, rotateInit = 0) => ({
    animate: { rotate: reverse ? rotateInit - 360 : rotateInit + 360 },
    initial: { rotate: rotateInit },
    transition: { duration, repeat: Infinity, ease: 'linear' as const },
  });

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="nucleus-grad" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="60%"  stopColor="#00d4ff" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#7c3aed" stopOpacity="0"   />
        </radialGradient>
        <filter id="atom-glow">
          <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
          <feMerge>
            <feMergeNode in="coloredBlur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Ring 1 – horizontal */}
      <motion.g style={{ originX: `${cx}px`, originY: `${cy}px` }} {...ring(3.5, false, 0)}>
        <ellipse cx={cx} cy={cy} rx={r} ry={r * 0.3}
          stroke="#00d4ff" strokeWidth="0.9" strokeOpacity="0.55" filter="url(#atom-glow)" />
        <circle  cx={cx + r} cy={cy} r={size * 0.045} fill="#00d4ff" filter="url(#atom-glow)" />
      </motion.g>

      {/* Ring 2 – 60° */}
      <motion.g style={{ originX: `${cx}px`, originY: `${cy}px` }} {...ring(5, true, 60)}>
        <ellipse cx={cx} cy={cy} rx={r} ry={r * 0.3}
          stroke="#7c3aed" strokeWidth="0.9" strokeOpacity="0.55" filter="url(#atom-glow)" />
        <circle  cx={cx - r} cy={cy} r={size * 0.045} fill="#7c3aed" filter="url(#atom-glow)" />
      </motion.g>

      {/* Ring 3 – 120° */}
      <motion.g style={{ originX: `${cx}px`, originY: `${cy}px` }} {...ring(4, false, 120)}>
        <ellipse cx={cx} cy={cy} rx={r} ry={r * 0.3}
          stroke="#e879f9" strokeWidth="0.9" strokeOpacity="0.55" filter="url(#atom-glow)" />
        <circle  cx={cx + r} cy={cy} r={size * 0.045} fill="#e879f9" filter="url(#atom-glow)" />
      </motion.g>

      {/* Nucleus */}
      <motion.circle
        cx={cx} cy={cy}
        r={size * 0.1}
        fill="url(#nucleus-grad)"
        filter="url(#atom-glow)"
        animate={{ scale: [1, 1.12, 1], opacity: [0.85, 1, 0.85] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      />
    </svg>
  );
}
