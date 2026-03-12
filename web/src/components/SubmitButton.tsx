/**
 * SubmitButton – morphing CTA button.
 * idle → pulse glow  |  loading → spinning ring  |  success → green burst  |  error → red shake
 */
import { motion, AnimatePresence } from 'framer-motion';
import type { AgentStatus } from '../types';

interface Props {
  status: AgentStatus;
  onClick: () => void;
  disabled?: boolean;
}

const LABELS: Record<AgentStatus, string> = {
  idle:    '▶  Run Agent',
  loading: 'Running…',
  success: '✓  Dispatched',
  error:   '✗  Retry',
};

const BG: Record<AgentStatus, string> = {
  idle:    'linear-gradient(135deg, #1e40af 0%, #1d4ed8 50%, #2563eb 100%)',
  loading: 'linear-gradient(135deg, #5b21b6 0%, #7c3aed 100%)',
  success: 'linear-gradient(135deg, #065f46 0%, #10b981 100%)',
  error:   'linear-gradient(135deg, #7f1d1d 0%, #ef4444 100%)',
};

const GLOW: Record<AgentStatus, string> = {
  idle:    'rgba(37,99,235,0.45)',
  loading: 'rgba(124,58,237,0.45)',
  success: 'rgba(16,185,129,0.45)',
  error:   'rgba(239,68,68,0.45)',
};

export default function SubmitButton({ status, onClick, disabled }: Props) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled || status === 'loading'}
      animate={status === 'error' ? { x: [0, -8, 8, -6, 6, 0] } : {}}
      transition={{ duration: 0.4 }}
      whileHover={status !== 'loading' ? { scale: 1.04, y: -2 } : {}}
      whileTap={status !== 'loading' ? { scale: 0.97 } : {}}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem',
        padding: '0.75rem 2rem',
        borderRadius: 12,
        border: 'none',
        cursor: disabled || status === 'loading' ? 'not-allowed' : 'pointer',
        fontFamily: 'var(--font-sans)',
        fontWeight: 700,
        fontSize: '0.95rem',
        letterSpacing: '0.01em',
        color: '#fff',
        background: BG[status],
        boxShadow: `0 0 24px ${GLOW[status]}, 0 4px 16px rgba(0,0,0,0.3)`,
        overflow: 'hidden',
        minWidth: 160,
        transition: 'background 0.4s ease, box-shadow 0.3s ease',
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {/* Idle pulse ring */}
      {status === 'idle' && (
        <motion.span
          animate={{ scale: [1, 1.6], opacity: [0.4, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: 12,
            border: '2px solid rgba(96,165,250,0.5)',
            pointerEvents: 'none',
          }}
        />
      )}

      {/* Loading spinner */}
      {status === 'loading' && (
        <motion.span
          animate={{ rotate: 360 }}
          transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
          style={{
            width: 16, height: 16,
            borderRadius: '50%',
            border: '2px solid rgba(255,255,255,0.25)',
            borderTopColor: '#fff',
            display: 'inline-block',
            flexShrink: 0,
          }}
        />
      )}

      {/* Shimmer sweep */}
      <motion.span
        initial={{ x: '-120%' }}
        animate={status !== 'loading' ? { x: ['−120%', '120%'] } : {}}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1.5 }}
        style={{
          position: 'absolute',
          top: 0, bottom: 0,
          width: '40%',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)',
          transform: 'skewX(-20deg)',
          pointerEvents: 'none',
        }}
      />

      <AnimatePresence mode="wait">
        <motion.span
          key={status}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.18 }}
        >
          {LABELS[status]}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}
