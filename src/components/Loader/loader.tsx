import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Moon, Sun } from 'lucide-react';

/**
 * Loader — a themeable 3D orbit spinner.
 *
 * Usage:
 *   <Loader />                         // follows system preference, full-screen overlay
 *   <Loader theme="dark" />            // force dark
 *   <Loader theme="light" />           // force light
 *   <Loader fullscreen={false} />      // inline (no fixed overlay), for embedding in a card
 *   <Loader label="Fetching data" />   // custom label text
 */
type LoaderTheme = 'light' | 'dark';

interface LoaderProps {
  theme?: LoaderTheme;
  fullscreen?: boolean;
  label?: string;
}

const Loader = ({ theme, fullscreen = true, label = 'Loading' }: LoaderProps) => {
  const [systemDark, setSystemDark] = useState(
    () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches
  );

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    if (!mq) return;
    const onChange = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener?.('change', onChange);
    return () => mq.removeEventListener?.('change', onChange);
  }, []);

  const resolvedTheme = theme || (systemDark ? 'dark' : 'light');

  const styleId = useMemo(
    () => `loader-styles-${Math.random().toString(36).slice(2, 9)}`,
    []
  );

  return (
    <div
      className="loader-root"
      data-theme={resolvedTheme}
      data-fullscreen={fullscreen ? 'true' : 'false'}
    >
      <style>{`
        .loader-root {
          --bg: #EEF1F6;
          --surface: rgba(255, 255, 255, 0.72);
          --surface-border: rgba(67, 80, 107, 0.10);
          --text: #3C4660;
          --muted: #8792A8;
          --accent-violet: #6C5CE7;
          --accent-teal: #00B8A0;
          --accent-amber: #FF9F45;
          --shadow: 0 20px 60px -20px rgba(67, 80, 107, 0.35);

          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Inter, system-ui, sans-serif;
        }

        .loader-root[data-theme='dark'] {
          --bg: #0B0F19;
          --surface: rgba(19, 24, 38, 0.72);
          --surface-border: rgba(231, 236, 247, 0.08);
          --text: #E7ECF7;
          --muted: #7883A0;
          --accent-violet: #8B7CF6;
          --accent-teal: #2DE0C4;
          --accent-amber: #FFB768;
          --shadow: 0 20px 60px -20px rgba(0, 0, 0, 0.6);
        }

        .loader-root[data-fullscreen='true'] {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: grid;
          place-items: center;
          background:
            radial-gradient(circle at 30% 20%, color-mix(in srgb, var(--accent-violet) 12%, transparent), transparent 55%),
            radial-gradient(circle at 70% 80%, color-mix(in srgb, var(--accent-teal) 10%, transparent), transparent 55%),
            var(--bg);
          transition: background 0.4s ease;
          isolation: isolate;
        }

        .loader-root[data-fullscreen='false'] {
          display: grid;
          place-items: center;
          padding: 3rem 2rem;
        }

        .loader-card {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.75rem;
        }

        .orbit {
          position: relative;
          width: 96px;
          height: 96px;
          perspective: 900px;
        }

        .orbit-core {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 14px;
          height: 14px;
          margin: -7px 0 0 -7px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--accent-violet), var(--accent-teal));
          box-shadow: 0 0 18px 2px color-mix(in srgb, var(--accent-violet) 55%, transparent);
          animation: pulseCore 1.6s ease-in-out infinite;
          z-index: 2;
        }

        .ring {
          position: absolute;
          inset: 0;
          border-radius: 50%;
          box-sizing: border-box;
        }

        .ring-a {
          border-bottom: 3px solid var(--accent-violet);
          animation: spinA 1.35s cubic-bezier(0.65, 0.05, 0.36, 1) infinite;
          filter: drop-shadow(0 0 6px color-mix(in srgb, var(--accent-violet) 45%, transparent));
        }

        .ring-b {
          border-right: 3px solid var(--accent-teal);
          animation: spinB 1.35s cubic-bezier(0.65, 0.05, 0.36, 1) infinite;
          animation-delay: 0.12s;
          filter: drop-shadow(0 0 6px color-mix(in srgb, var(--accent-teal) 45%, transparent));
        }

        .ring-c {
          border-top: 3px solid var(--accent-amber);
          animation: spinC 1.35s cubic-bezier(0.65, 0.05, 0.36, 1) infinite;
          animation-delay: 0.24s;
          filter: drop-shadow(0 0 6px color-mix(in srgb, var(--accent-amber) 45%, transparent));
        }

        .loader-text-row {
          display: flex;
          align-items: center;
          gap: 0.4rem;
        }

        .loader-label {
          font-size: 0.8rem;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--muted);
        }

        .dots {
          display: inline-flex;
          gap: 0.28rem;
          align-items: center;
        }

        .dots span {
          width: 0.3rem;
          height: 0.3rem;
          border-radius: 50%;
          background: var(--accent-teal);
          animation: pulseDot 1.2s infinite ease-in-out;
        }

        .dots span:nth-child(2) { animation-delay: 0.15s; background: var(--accent-violet); }
        .dots span:nth-child(3) { animation-delay: 0.3s; background: var(--accent-amber); }

        .theme-toggle {
          position: absolute;
          top: 1rem;
          right: 1rem;
          width: 34px;
          height: 34px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          border: 1px solid var(--surface-border);
          background: transparent;
          color: var(--muted);
          cursor: pointer;
          transition: color 0.2s ease, transform 0.2s ease;
        }

        .theme-toggle:hover {
          color: var(--text);
          transform: scale(1.06);
        }

        @keyframes spinA {
          0%   { transform: rotateX(48deg) rotateY(-42deg) rotateZ(0deg); }
          100% { transform: rotateX(48deg) rotateY(-42deg) rotateZ(360deg); }
        }
        @keyframes spinB {
          0%   { transform: rotateX(48deg) rotateY(42deg) rotateZ(0deg); }
          100% { transform: rotateX(48deg) rotateY(42deg) rotateZ(360deg); }
        }
        @keyframes spinC {
          0%   { transform: rotateX(-62deg) rotateY(0deg) rotateZ(0deg); }
          100% { transform: rotateX(-62deg) rotateY(0deg) rotateZ(360deg); }
        }
        @keyframes pulseCore {
          0%, 100% { transform: scale(1); opacity: 1; }
          50%      { transform: scale(0.72); opacity: 0.65; }
        }
        @keyframes pulseDot {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40%           { transform: translateY(-0.18rem); opacity: 1; }
        }

        @media (prefers-reduced-motion: reduce) {
          .ring-a, .ring-b, .ring-c, .orbit-core, .dots span {
            animation-duration: 2.6s;
          }
        }
      `}</style>

      <div className="loader-card" aria-live="polite" aria-busy="true">
        <div className="orbit" role="status" aria-label={label}>
          <div className="ring ring-a" />
          <div className="ring ring-b" />
          <div className="ring ring-c" />
          <div className="orbit-core" />
        </div>

        <div className="loader-text-row">
          <span className="loader-label">{label}</span>
          <span className="dots" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </div>
      </div>
    </div>
  );
};

/**
 * Demo wrapper — shows the loader with a manual light/dark toggle so you can
 * preview both themes. Drop just <Loader /> into your app; this default
 * export is only here for preview purposes in this artifact.
 */
const LoaderDemo = () => {
  const [manualTheme, setManualTheme] = useState<LoaderTheme>('dark');

  const toggle = useCallback(() => {
    setManualTheme((t) => (t === 'dark' ? 'light' : 'dark'));
  }, []);

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <Loader theme={manualTheme} label="Loading" />
      <button
        onClick={toggle}
        aria-label="Toggle theme"
        style={{
          position: 'fixed',
          top: '1.25rem',
          right: '1.25rem',
          width: 40,
          height: 40,
          borderRadius: '50%',
          border: '1px solid rgba(128,128,128,0.25)',
          background: manualTheme === 'dark' ? '#131826' : '#FFFFFF',
          color: manualTheme === 'dark' ? '#E7ECF7' : '#3C4660',
          display: 'grid',
          placeItems: 'center',
          cursor: 'pointer',
          boxShadow: '0 8px 24px -8px rgba(0,0,0,0.3)',
          zIndex: 10,
        }}
      >
        {manualTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>
    </div>
  );
};

export { Loader, LoaderDemo };
export default Loader;