/**
 * AnimatedTextarea – textarea with floating label and animated focus ring.
 * Wraps a native textarea in a motion.div for FM12 compatibility.
 */
import { useState, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { TextareaHTMLAttributes } from 'react';

interface Props extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  hint?: string;
  error?: string;
}

export default function AnimatedTextarea({ label, hint, error, ...textareaProps }: Props) {
  const [focused, setFocused] = useState(false);
  const id = useId();
  const hasValue = Boolean(textareaProps.value);
  const lifted = focused || hasValue;

  const borderColor = error
    ? '#ef4444'
    : focused
    ? 'rgba(0,212,255,0.6)'
    : 'rgba(255,255,255,0.07)';

  const boxShadow = error
    ? '0 0 0 3px rgba(239,68,68,0.12)'
    : focused
    ? '0 0 0 3px rgba(0,212,255,0.12), 0 0 20px rgba(0,212,255,0.06)'
    : 'none';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
      <div style={{ position: 'relative' }}>
        {/* Floating label */}
        <label
          htmlFor={id}
          style={{
            position: 'absolute',
            left: 13,
            top: lifted ? 8 : 16,
            transformOrigin: 'left top',
            transform: lifted ? 'scale(0.78)' : 'scale(1)',
            transition: 'top 0.22s ease, transform 0.22s ease, color 0.2s ease',
            pointerEvents: 'none',
            fontWeight: 500,
            fontSize: '0.9rem',
            zIndex: 2,
            color: lifted ? (error ? '#ef4444' : '#00d4ff') : 'var(--text-muted)',
          }}
        >
          {label}
          {textareaProps.required && <span style={{ color: '#e879f9', marginLeft: 2 }}>*</span>}
        </label>

        {/* Animated border wrapper */}
        <motion.div
          animate={{ borderColor, boxShadow }}
          transition={{ duration: 0.2 }}
          style={{
            borderRadius: 10,
            border: `1px solid ${borderColor}`,
            overflow: 'hidden',
          }}
        >
          <textarea
            id={id}
            {...textareaProps}
            onFocus={e => { setFocused(true); textareaProps.onFocus?.(e); }}
            onBlur={e => { setFocused(false); textareaProps.onBlur?.(e); }}
            style={{
              width: '100%',
              paddingTop: '2rem',
              paddingBottom: '0.75rem',
              paddingLeft: 13,
              paddingRight: 13,
              background: 'rgba(6, 10, 22, 0.8)',
              border: 'none',
              borderRadius: 10,
              color: 'var(--text)',
              fontFamily: 'var(--font-sans)',
              fontSize: '0.9rem',
              outline: 'none',
              resize: 'vertical',
              minHeight: 120,
              lineHeight: 1.65,
              display: 'block',
              ...textareaProps.style,
            }}
          />
        </motion.div>
      </div>

      <AnimatePresence mode="wait">
        {error ? (
          <motion.span
            key="err"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{ fontSize: '0.75rem', color: '#ef4444', paddingLeft: 2 }}
          >
            {error}
          </motion.span>
        ) : hint ? (
          <motion.span
            key="hint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ fontSize: '0.75rem', color: 'var(--text-muted)', paddingLeft: 2 }}
          >
            {hint}
          </motion.span>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
