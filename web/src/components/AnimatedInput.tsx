/**
 * AnimatedInput – text/password input with floating label and cyan focus glow.
 * Uses a wrapper div for Framer Motion border animation to avoid FM12 type
 * conflicts with spreading InputHTMLAttributes onto motion.input.
 */
import { useState, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { InputHTMLAttributes, ReactNode } from 'react';

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
  error?: string;
  icon?: ReactNode;
}

export default function AnimatedInput({ label, hint, error, icon, ...inputProps }: Props) {
  const [focused, setFocused] = useState(false);
  const id = useId();
  const hasValue = Boolean(inputProps.value);
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
            left: icon ? 38 : 13,
            top: lifted ? 8 : '50%',
            transformOrigin: 'left top',
            transform: lifted ? 'scale(0.78) translateY(0)' : 'translateY(-50%)',
            transition: 'top 0.22s ease, transform 0.22s ease, color 0.2s ease',
            pointerEvents: 'none',
            fontWeight: 500,
            fontSize: '0.9rem',
            zIndex: 2,
            color: lifted ? (error ? '#ef4444' : '#00d4ff') : 'var(--text-muted)',
          }}
        >
          {label}
          {inputProps.required && <span style={{ color: '#e879f9', marginLeft: 2 }}>*</span>}
        </label>

        {/* Icon */}
        {icon && (
          <span
            style={{
              position: 'absolute', left: 12, top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none', zIndex: 2,
              display: 'flex', alignItems: 'center',
              color: focused ? '#00d4ff' : 'var(--text-muted)',
              transition: 'color 0.2s',
            }}
          >
            {icon}
          </span>
        )}

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
          <input
            id={id}
            {...inputProps}
            onFocus={e => { setFocused(true); inputProps.onFocus?.(e); }}
            onBlur={e => { setFocused(false); inputProps.onBlur?.(e); }}
            style={{
              width: '100%',
              paddingTop: '1.3rem',
              paddingBottom: '0.55rem',
              paddingLeft: icon ? 38 : 13,
              paddingRight: 13,
              background: 'rgba(6, 10, 22, 0.8)',
              border: 'none',
              borderRadius: 10,
              color: 'var(--text)',
              fontFamily: 'var(--font-sans)',
              fontSize: '0.9rem',
              outline: 'none',
              display: 'block',
              ...inputProps.style,
            }}
          />
        </motion.div>
      </div>

      {/* Hint / Error */}
      <AnimatePresence mode="wait">
        {error ? (
          <motion.span
            key="err"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
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
