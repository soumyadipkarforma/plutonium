/**
 * StatusPanel – animated log output.
 * Each log entry slides in from the right, colour-coded by level.
 * The panel only renders once there is at least one log entry.
 */
import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity } from 'lucide-react';
import GlowCard from './GlowCard';
import { SectionLabel } from './ConfigCard';
import type { LogEntry } from '../types';

const LEVEL_COLOR: Record<LogEntry['level'], string> = {
  info: 'var(--text-dim)',
  ok:   '#10b981',
  warn: '#f59e0b',
  err:  '#ef4444',
};

const LEVEL_BG: Record<LogEntry['level'], string> = {
  info: 'rgba(255,255,255,0.02)',
  ok:   'rgba(16,185,129,0.06)',
  warn: 'rgba(245,158,11,0.06)',
  err:  'rgba(239,68,68,0.06)',
};

interface Props {
  logs: LogEntry[];
}

export default function StatusPanel({ logs }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new entries
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <AnimatePresence>
      {logs.length > 0 && (
        <motion.div
          key="status-panel"
          initial={{ opacity: 0, height: 0, marginTop: 0 }}
          animate={{ opacity: 1, height: 'auto', marginTop: 0 }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <GlowCard delay={0}>
            <SectionLabel number="03" title="Agent Status" />

            {/* Live indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
              <motion.span
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1.2, repeat: Infinity }}
                style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', display: 'inline-block' }}
              />
              <span style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Live
              </span>
              <Activity size={12} style={{ color: '#10b981', marginLeft: 2 }} />
            </div>

            {/* Log container */}
            <div
              style={{
                background: 'rgba(4, 6, 15, 0.6)',
                borderRadius: 10,
                border: '1px solid rgba(255,255,255,0.05)',
                maxHeight: 300,
                overflowY: 'auto',
                padding: '0.5rem',
              }}
            >
              <AnimatePresence initial={false}>
                {logs.map(entry => (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, x: 18, height: 0 }}
                    animate={{ opacity: 1, x: 0, height: 'auto' }}
                    exit={{ opacity: 0, x: -18, height: 0 }}
                    transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                    style={{
                      display: 'flex',
                      gap: '0.75rem',
                      padding: '0.35rem 0.5rem',
                      borderRadius: 7,
                      background: LEVEL_BG[entry.level],
                      marginBottom: '0.15rem',
                      overflow: 'hidden',
                    }}
                  >
                    {/* Timestamp */}
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.72rem',
                      color: 'var(--text-muted)',
                      flexShrink: 0,
                      alignSelf: 'flex-start',
                      paddingTop: 1,
                    }}>
                      {entry.ts}
                    </span>

                    {/* Level dot */}
                    <span style={{
                      width: 6, height: 6,
                      borderRadius: '50%',
                      background: LEVEL_COLOR[entry.level],
                      marginTop: 5,
                      flexShrink: 0,
                    }} />

                    {/* Message */}
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.78rem',
                      color: LEVEL_COLOR[entry.level],
                      lineHeight: 1.6,
                      wordBreak: 'break-word',
                    }}>
                      {entry.message}
                    </span>
                  </motion.div>
                ))}
              </AnimatePresence>
              <div ref={bottomRef} />
            </div>
          </GlowCard>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
