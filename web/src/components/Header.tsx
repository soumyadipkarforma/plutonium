/**
 * Header – animated site header with atom logo, title and tagline.
 * Staggered entrance via Framer Motion.
 */
import { motion } from 'framer-motion';
import type { Variants } from 'framer-motion';
import AtomLogo from './AtomLogo';

// BezierDefinition must be a 4-tuple – cast explicitly for FM12 strict types
const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: -20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: EASE },
  },
};

export default function Header() {
  return (
    <motion.header
      variants={container}
      initial="hidden"
      animate="show"
      style={{
        position: 'relative',
        zIndex: 10,
        padding: '2.25rem 1.5rem 1.75rem',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        background: 'linear-gradient(180deg, rgba(4,6,15,0.95) 0%, rgba(4,6,15,0) 100%)',
        backdropFilter: 'blur(8px)',
        textAlign: 'center',
      }}
    >
      {/* Atom */}
      <motion.div
        variants={item}
        style={{ display: 'inline-block', marginBottom: '0.75rem' }}
        whileHover={{ scale: 1.08 }}
        transition={{ type: 'spring', stiffness: 300, damping: 18 }}
      >
        <AtomLogo size={64} />
      </motion.div>

      {/* Title */}
      <motion.h1
        variants={item}
        style={{
          fontSize: 'clamp(1.8rem, 5vw, 2.8rem)',
          fontWeight: 900,
          letterSpacing: '-0.04em',
          lineHeight: 1,
          background: 'linear-gradient(135deg, #ffffff 0%, #00d4ff 45%, #7c3aed 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          marginBottom: '0.5rem',
        }}
      >
        Plutonium
      </motion.h1>

      {/* Subtitle badge */}
      <motion.div variants={item} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            fontSize: '0.7rem',
            fontWeight: 600,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: '#00d4ff',
            background: 'rgba(0,212,255,0.1)',
            border: '1px solid rgba(0,212,255,0.25)',
            borderRadius: '999px',
            padding: '0.25rem 0.75rem',
          }}
        >
          <motion.span
            animate={{ opacity: [1, 0.3, 1] }}
            transition={{ duration: 1.6, repeat: Infinity }}
            style={{ width: 6, height: 6, borderRadius: '50%', background: '#00d4ff', display: 'inline-block' }}
          />
          MCP Orchestration Platform
        </span>
      </motion.div>

      {/* Tagline */}
      <motion.p
        variants={item}
        style={{
          fontSize: '0.9rem',
          color: 'var(--text-dim)',
          letterSpacing: '0.01em',
          maxWidth: 480,
          margin: '0 auto',
        }}
      >
        Serverless AI agent · GitHub Actions runtime · Extensible MCP tools
      </motion.p>
    </motion.header>
  );
}
