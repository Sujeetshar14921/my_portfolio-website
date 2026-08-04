import { motion } from "framer-motion";
import { ArrowRight, Mail, Download, ArrowDown } from "lucide-react";
import { Link } from "react-router-dom";
import { Profile } from "@/types";
import { useState } from "react";
import Ribbon from "../ribbon/ribbon";

interface HeroProps {
  profile: Profile | null;
}

export default function HeroSection({ profile }: HeroProps) {
  const [resumeHover, setResumeHover] = useState(false);
  const displayName = profile?.name || 'Sujeet Sharma';
  const role = profile?.role || 'Full Stack Developer';
  const tagline = profile?.tagline || 'Building elegant solutions with modern technologies and thoughtful design';

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
      <div
        className="absolute inset-0 w-full h-full bg-cover bg-center"
        style={{
          backgroundImage: `url('/bgImage.jpg')`,
        }}
      />

      <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/55 to-black/75" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.1) 100%)`,
        }}
      />

      <div className="pointer-events-none absolute -top-24 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-primary-500/10 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full bg-sky-400/10 blur-3xl" />

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