/**
 * Footer – minimal animated footer.
 */
import { motion } from 'framer-motion';
import { Github, Zap } from 'lucide-react';

export default function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.0, duration: 0.6 }}
      style={{
        position: 'relative',
        zIndex: 10,
        borderTop: '1px solid rgba(255,255,255,0.05)',
        padding: '1.25rem 1.5rem',
        textAlign: 'center',
        background: 'rgba(4,6,15,0.8)',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1rem',
        flexWrap: 'wrap',
        fontSize: '0.78rem',
        color: 'var(--text-muted)',
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <Zap size={12} style={{ color: '#00d4ff' }} />
          MIT License
        </span>

        <span style={{ color: 'rgba(255,255,255,0.15)' }}>·</span>

        <motion.a
          href="https://github.com/soumyadipkarforma/plutonium"
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ color: '#00d4ff', scale: 1.05 }}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.35rem',
            color: 'var(--text-muted)', textDecoration: 'none',
            transition: 'color 0.2s',
          }}
        >
          <Github size={13} />
          soumyadipkarforma/plutonium
        </motion.a>

        <span style={{ color: 'rgba(255,255,255,0.15)' }}>·</span>

        <span>Node&nbsp;24 · React&nbsp;19 · Framer&nbsp;Motion&nbsp;12</span>
      </div>
    </motion.footer>
  );
}
