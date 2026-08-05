import { motion } from "framer-motion";
import { ArrowRight, ArrowDown, Download, VolumeX } from "lucide-react";
import { Profile } from "@/types";
import { useEffect, useRef, useState } from "react";
import Ribbon from "../ribbon/ribbon";

type MusicEngine = {
  context: AudioContext;
  gain: GainNode;
  source: AudioBufferSourceNode;
};

const SUPABASE_PUBLIC_STORAGE_BASE = `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/media`;
const SUPABASE_STORAGE_REGEX = /\/storage\/v1\/object\/(?:public\/)?media\/(.+)$/;

function resolveStorageAudioUrl(value: string) {
  if (!value) return '';
  if (/^https?:\/\//.test(value)) {
    const match = value.match(SUPABASE_STORAGE_REGEX);
    if (match) {
      return `${SUPABASE_PUBLIC_STORAGE_BASE}/${encodeURI(match[1])}`;
    }
    return value;
  }

  return `${SUPABASE_PUBLIC_STORAGE_BASE}/${encodeURI(value)}`;
}

const HERO_MUSIC_VOLUME = 0.14;
const HERO_MUSIC_LOOP_SECONDS = 4;

function clamp(value: number, min = -1, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function createHeroMusicBuffer(context: AudioContext) {
  const sampleRate = context.sampleRate;
  const length = Math.floor(sampleRate * HERO_MUSIC_LOOP_SECONDS);
  const buffer = context.createBuffer(2, length, sampleRate);
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);

  const kickTimes = [0, 1, 2, 3];
  const snareTimes = [0.5, 1.5, 2.5, 3.5];
  const hatTimes = [0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3, 3.25, 3.5, 3.75];
  const bassNotes = [55, 65.41, 73.42, 61.74, 55, 65.41, 82.41, 73.42];
  const chordNotes = [220, 261.63, 174.61, 196];

  const noise = (time: number, seed: number) => {
    const value = Math.sin(time * 1234.567 + seed * 91.7) * 43758.5453;
    return value - Math.floor(value);
  };

  for (let i = 0; i < length; i += 1) {
    const time = i / sampleRate;
    let sample = 0;

    kickTimes.forEach((kickTime) => {
      const delta = time - kickTime;
      if (delta >= 0 && delta < 0.28) {
        const sweep = 1 - Math.min(delta / 0.28, 1);
        const frequency = 110 - sweep * 60;
        sample += Math.sin(2 * Math.PI * frequency * delta) * Math.exp(-delta * 14) * 0.95;
      }
    });

    snareTimes.forEach((snareTime) => {
      const delta = time - snareTime;
      if (delta >= 0 && delta < 0.18) {
        const env = Math.exp(-delta * 24);
        const hit = noise(time, snareTime) * 2 - 1;
        sample += hit * env * 0.34;
      }
    });

    hatTimes.forEach((hatTime, index) => {
      const delta = time - hatTime;
      if (delta >= 0 && delta < 0.08) {
        const env = Math.exp(-delta * 42);
        const hit = noise(time, index + 8) * 2 - 1;
        sample += hit * env * 0.12;
      }
    });

    const beatIndex = Math.floor(time / 0.5) % bassNotes.length;
    const beatDelta = time % 0.5;
    const bassEnv = beatDelta < 0.46 ? Math.exp(-beatDelta * 4.2) : 0;
    sample += Math.sin(2 * Math.PI * bassNotes[beatIndex] * time) * bassEnv * 0.14;

    const chordSlot = Math.floor(time / 2) % chordNotes.length;
    const chordDelta = time % 2;
    const chordEnv = chordDelta < 1.95 ? 0.1 + Math.exp(-chordDelta * 1.6) * 0.12 : 0;
    const chordRoot = chordNotes[chordSlot];
    sample += Math.sin(2 * Math.PI * chordRoot * time) * chordEnv * 0.09;
    sample += Math.sin(2 * Math.PI * chordRoot * 1.25 * time) * chordEnv * 0.05;
    sample += Math.sin(2 * Math.PI * chordRoot * 1.5 * time) * chordEnv * 0.05;

    const pulse = 1 - Math.min(Math.abs((time % 0.5) - 0.25) / 0.25, 1);
    sample += pulse * 0.03;

    const fadeIn = Math.min(1, time / 0.04);
    const fadeOut = Math.min(1, (HERO_MUSIC_LOOP_SECONDS - time) / 0.04);
    const fade = Math.min(fadeIn, fadeOut, 1);
    const value = clamp(sample * 0.45 * fade);

    left[i] = value * 0.92;
    right[i] = value;
  }

  return buffer;
}

interface HeroProps {
  profile: Profile | null;
}

export default function HeroSection({ profile }: HeroProps) {
  const [resumeHover, setResumeHover] = useState(false);
  const [muted, setMuted] = useState(false);
  const [needsUnlock, setNeedsUnlock] = useState(false);
  const musicRef = useRef<MusicEngine | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const displayName = profile?.name || 'Sujeet Sharma';
  const role = profile?.role || 'Full Stack Developer';
  const tagline = profile?.tagline || 'Building elegant solutions with modern technologies and thoughtful design';

  useEffect(() => {
    if (profile?.hero_music_url) {
      const audio = new Audio(resolveStorageAudioUrl(profile.hero_music_url));
      audio.loop = true;
      audio.volume = muted ? 0 : HERO_MUSIC_VOLUME;
      audio.muted = muted;
      audioRef.current = audio;

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setNeedsUnlock(false))
          .catch(() => setNeedsUnlock(true));
      }

      return () => {
        audio.pause();
        audio.src = '';
        audioRef.current = null;
      };
    }

    const AudioContextCtor = window.AudioContext;
    if (!AudioContextCtor) {
      return;
    }

    const context = new AudioContextCtor();
    const gain = context.createGain();
    gain.gain.value = muted ? 0 : HERO_MUSIC_VOLUME;
    gain.connect(context.destination);

    const source = context.createBufferSource();
    source.buffer = createHeroMusicBuffer(context);
    source.loop = true;
    source.connect(gain);
    source.start();

    musicRef.current = { context, gain, source };
    setNeedsUnlock(context.state !== 'running');

    const syncUnlockState = () => {
      setNeedsUnlock(context.state !== 'running' && !muted);
    };

    const unlock = () => {
      void context.resume().then(syncUnlockState).catch(syncUnlockState);
    };

    const handleFirstInteraction = () => unlock();
    window.addEventListener('pointerdown', handleFirstInteraction, { once: true, passive: true });
    window.addEventListener('keydown', handleFirstInteraction, { once: true });
    context.onstatechange = syncUnlockState;

    return () => {
      window.removeEventListener('pointerdown', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
      source.stop();
      source.disconnect();
      gain.disconnect();
      void context.close();
      musicRef.current = null;
    };
  }, [profile?.hero_music_url]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = muted;
      audioRef.current.volume = muted ? 0 : HERO_MUSIC_VOLUME;
      if (!muted) {
        void audioRef.current.play().catch(() => {});
      }
      return;
    }

    const engine = musicRef.current;
    if (!engine) {
      return;
    }

    const targetVolume = muted ? 0 : HERO_MUSIC_VOLUME;
    engine.gain.gain.setTargetAtTime(targetVolume, engine.context.currentTime, 0.02);
    if (!muted) {
      void engine.context.resume().catch(() => {});
    }
    setNeedsUnlock(engine.context.state !== 'running' && !muted);
  }, [muted]);

  const toggleMusic = () => {
    setMuted((currentMuted) => !currentMuted);
  };

  const heroVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 18 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <section className="relative w-full min-h-[100dvh] flex items-center justify-center overflow-hidden bg-surface-950">
      <motion.div
        className="absolute inset-0 w-full h-full bg-cover bg-center"
        style={{
          backgroundImage: `url('/bgImage.jpg')`,
        }}
        animate={
          muted
            ? { x: 0, y: 0, scale: 1 }
            : {
                x: [0, -3, 2, -2, 3, -1, 0],
                y: [0, 2, -2, 1, -1, 2, 0],
                scale: 1.03,
              }
        }
        transition={
          muted
            ? { duration: 0.4 }
            : {
                x: { duration: 0.5, repeat: Infinity, ease: 'easeInOut' },
                y: { duration: 0.5, repeat: Infinity, ease: 'easeInOut' },
                scale: { duration: 0.4 },
              }
        }
      />

      <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/55 to-black/75" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.1) 100%)`,
        }}
      />

      <motion.div
        className="pointer-events-none absolute -top-24 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-primary-500/10 blur-3xl"
        animate={
          muted
            ? { scale: 1, opacity: 0.5 }
            : { scale: [1, 1.18, 1], opacity: [0.4, 0.75, 0.4] }
        }
        transition={
          muted
            ? { duration: 0.6 }
            : { duration: 2, repeat: Infinity, ease: 'easeInOut' }
        }
      />
      <motion.div
        className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full bg-sky-400/10 blur-3xl"
        animate={
          muted
            ? { scale: 1, opacity: 0.4 }
            : { scale: [1, 1.22, 1], opacity: [0.3, 0.65, 0.3] }
        }
        transition={
          muted
            ? { duration: 0.6 }
            : { duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }
        }
      />

      <motion.button
        type="button"
        onClick={toggleMusic}
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        className="absolute bottom-4 right-4 z-20 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/45 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white shadow-lg backdrop-blur-md transition-colors hover:bg-black/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 sm:bottom-6 sm:right-6"
        aria-pressed={!muted}
        aria-label={muted ? 'Unmute hero music' : 'Mute hero music'}
        animate={
          muted
            ? { boxShadow: '0 0 0 0 rgba(96,165,250,0)' }
            : {
                boxShadow: [
                  '0 0 0 0 rgba(96,165,250,0.35)',
                  '0 0 0 8px rgba(96,165,250,0)',
                ],
              }
        }
        transition={
          muted
            ? { duration: 0.4 }
            : { duration: 1.6, repeat: Infinity, ease: 'easeOut' }
        }
      >
        {muted ? (
          <VolumeX size={16} />
        ) : (
          <div className="flex items-end gap-[3px] h-4 w-4">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="w-[3px] rounded-full bg-white"
                animate={{ height: ['30%', '100%', '45%', '80%', '30%'] }}
                transition={{
                  duration: 0.9 + i * 0.15,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: i * 0.12,
                }}
              />
            ))}
          </div>
        )}
        <span>{muted ? 'Muted' : 'Music On'}</span>
      </motion.button>

      {needsUnlock && !muted && (
        <div className="absolute bottom-16 right-4 z-20 rounded-full border border-white/15 bg-black/50 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.18em] text-white/70 backdrop-blur-md sm:bottom-20 sm:right-6">
          Tap once to start audio
        </div>
      )}

      <motion.div
        variants={heroVariants}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-full max-w-screen-xl mx-auto px-4 sm:px-8 lg:px-12 flex flex-col items-center justify-center pt-4 pb-6 sm:pt-16 sm:pb-20 md:pt-20 md:pb-28"
      >
        <motion.div variants={itemVariants}>
          <Ribbon />
        </motion.div>

        <motion.div variants={itemVariants} className="w-full">
          <h1
            className="uppercase leading-[0.9] text-center mb-6 font-black tracking-[0.06em] transition-transform duration-300 hover:scale-105 text-balance"
            style={{
              fontSize: "clamp(2.7rem, 7.6vw, 11rem)",
              fontFamily: "'Space Grotesk', sans-serif",
              color: "transparent",
              WebkitTextStroke: "1.5px rgba(255,255,255,0.85)",
              letterSpacing: "0.01em",
              filter: "drop-shadow(0 0 18px rgba(255,255,255,0.15))",
            }}
          >
            {displayName}
          </h1>
        </motion.div>

        <motion.h2
          variants={itemVariants}
          className="font-black leading-tight tracking-[-0.03em] text-white text-center mb-10 break-words transition-transform duration-300 hover:scale-105 text-balance"
          style={{
            fontSize: "clamp(1.8rem, 5vw, 4.5rem)",
            textShadow: "0 8px 25px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.7)",
          }}
        >
          {role.split(" ").map((word, i) => (
            <span key={i} className={i === 1 ? "text-primary-400" : ""}>
              {word}{" "}
            </span>
          ))}
        </motion.h2>

        <motion.p
          variants={itemVariants}
          className="text-center text-white/85 mb-10 max-w-2xl leading-8 px-2 text-pretty"
          style={{
            fontSize: "clamp(0.95rem, 2.5vw, 1.2rem)",
            textShadow: "0 4px 15px rgba(0,0,0,0.6)",
          }}
        >
          {tagline}
        </motion.p>

        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center gap-4">
          <motion.a
            href={profile?.resume_url || "#"}
            onMouseEnter={() => setResumeHover(true)}
            onMouseLeave={() => setResumeHover(false)}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="group relative inline-flex items-center gap-3 px-8 py-5 overflow-hidden border border-white/30 rounded-2xl backdrop-blur-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            aria-label="Download resume"
          >
            <motion.div
              className="absolute -inset-1 rounded-lg opacity-0 group-hover:opacity-100"
              animate={{
                boxShadow: resumeHover
                  ? "0 0 40px 20px rgba(96, 165, 250, 0.7)"
                  : "0 0 0 0 rgba(96, 165, 250, 0)",
              }}
              transition={{ duration: 0.6 }}
            />

            <div className="relative z-10 flex items-center gap-3">
              <motion.div
                animate={{
                  rotate: resumeHover ? [0, -12, 12, 0] : 0,
                  scale: resumeHover ? [1, 1.12, 1] : 1,
                }}
                transition={{ duration: 0.7 }}
              >
                <Download size={20} className="text-white font-bold" />
              </motion.div>

              <span className="text-white font-black text-base tracking-wider uppercase">
                Download Resume
              </span>

              <motion.div
                animate={{ x: resumeHover ? [0, 6, 0] : 0 }}
                transition={{ duration: 0.6, repeat: resumeHover ? Infinity : 0 }}
              >
                <ArrowRight size={18} className="text-white" />
              </motion.div>
            </div>

            <motion.div
              className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-0"
              animate={{
                opacity: resumeHover ? [0, 1, 0] : 0,
                x: resumeHover ? [-200, 200] : 0,
              }}
              transition={{ duration: 0.8, repeat: resumeHover ? Infinity : 0 }}
            />
          </motion.a>
        </motion.div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        className="hidden md:flex absolute bottom-8 left-1/2 -translate-x-1/2 flex-col items-center gap-3 pointer-events-none"
      >
        <span className="text-xs font-mono uppercase tracking-[0.2em] text-white/50">
          Scroll to explore
        </span>
        <motion.div
          animate={{ y: [0, 12, 0] }}
          transition={{ duration: 2.5, repeat: Infinity }}
          className="text-white/50"
        >
          <ArrowDown size={18} />
        </motion.div>
      </motion.div>
    </section>
  );
}