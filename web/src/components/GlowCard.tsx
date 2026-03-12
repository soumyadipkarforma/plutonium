/**
 * GlowCard – reusable glassmorphism card with animated gradient border on hover.
 */
import { motion } from 'framer-motion';
import type { ReactNode, CSSProperties } from 'react';

interface Props {
  children: ReactNode;
  delay?: number;
  style?: CSSProperties;
  className?: string;
}

export default function GlowCard({ children, delay = 0, style, className }: Props) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover="hovered"
      style={{
        position: 'relative',
        borderRadius: 16,
        padding: '1.75rem',
        background: 'var(--surface)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid var(--border)',
        ...style,
      }}
    >
      {/* Animated glow border overlay */}
      <motion.div
        variants={{
          hovered: { opacity: 1 },
        }}
        initial={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 16,
          padding: 1,
          background: 'linear-gradient(135deg, rgba(0,212,255,0.5), rgba(124,58,237,0.5), rgba(232,121,249,0.3))',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
          pointerEvents: 'none',
        }}
      />

      {/* Inner top-edge shimmer */}
      <motion.div
        variants={{ hovered: { opacity: 0.6, x: ['0%', '100%'] } }}
        initial={{ opacity: 0, x: '-100%' }}
        transition={{ duration: 1.2, ease: 'easeInOut' }}
        style={{
          position: 'absolute',
          top: 0, left: 0,
          width: '40%', height: 1,
          background: 'linear-gradient(90deg, transparent, #00d4ff, transparent)',
          borderRadius: 1,
          pointerEvents: 'none',
        }}
      />

      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </motion.div>
  );
}
