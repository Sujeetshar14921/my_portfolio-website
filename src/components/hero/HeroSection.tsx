import { motion } from "framer-motion";
import { ArrowRight, Mail, Download, ArrowDown } from "lucide-react";
import { Link } from "react-router-dom";
import { Profile } from "@/types";
import { useState } from "react";

interface HeroProps {
  profile: Profile | null;
}

export default function HeroSection({ profile }: HeroProps) {
  const [resumeHover, setResumeHover] = useState(false);

  return (
    <section className="relative w-full min-h-screen flex items-center justify-center overflow-hidden bg-surface-950">
      {/* Background Image */}
      <div
        className="absolute inset-0 w-full h-full bg-cover bg-center "
        style={{
          backgroundImage: `url('../bgImage.jpg')`,
        }}
      />

      {/* Smart Dark Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/55 to-black/75" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(ellipse at 50% 50%, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.1) 100%)`
        }}
      />

      {/* Main content */}
      <div className="relative z-10 w-full max-w-screen-xl mx-auto px-4 sm:px-8 lg:px-12 flex flex-col items-center justify-center pt-20 pb-28">

        {/* Status Badge */}
        <div className="mb-12 inline-flex items-center gap-3 px-5 py-2.5 border border-white/30 backdrop-blur-md text-xs rounded-full font-mono uppercase tracking-[0.15em] text-white/90">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75 animate-pulse" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <span>Available for freelance</span>
        </div>

        {/* Name - Single Color, Simple */}
        <h1
          className="uppercase leading-[0.9] text-center mb-6 break-words font-black"
          style={{
            fontSize: "clamp(3rem, 8vw, 12rem)",
            fontFamily: "'Space Grotesk', sans-serif",
            color: "transparent",
            WebkitTextStroke: "1.5px rgba(255,255,255,0.8)",
            letterSpacing: "-0.05em",
            filter: "drop-shadow(0 0 15px rgba(255,255,255,0.15))",
          }}
        >
          {profile?.name || "Sujeet Sharma"}
        </h1>
        {/* Profession - Single Color */}
        <h2
          className="font-black leading-tight tracking-[-0.03em] text-white text-center mb-10 break-words"
          style={{
            fontSize: "clamp(1.8rem, 5vw, 4.5rem)",
            textShadow: "0 8px 25px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.7)",
          }}
        >
          {(profile?.role || "Full Stack Developer")
            .split(" ")
            .map((word, i) => (
              <span
                key={i}
                className={i === 1 ? "text-orange-600" : ""}
              >
                {word}{" "}
              </span>
            ))}
        </h2>
        {/* Tagline */}
        <p
          className="text-center text-white/85 mb-12 max-w-2xl leading-relaxed px-2"
          style={{
            fontSize: "clamp(0.95rem, 2.5vw, 1.25rem)",
            textShadow: "0 4px 15px rgba(0,0,0,0.6)",
          }}
        >
          {profile?.tagline ||
            "Building elegant solutions with modern technologies and thoughtful design"}
        </p>

        {/* Resume Button */}
        <motion.a
          href={profile?.resume_url || "#"}
          onMouseEnter={() => setResumeHover(true)}
          onMouseLeave={() => setResumeHover(false)}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          className="group relative inline-flex items-center gap-3 px-8 py-5 overflow-hidden border border-white/30 backdrop-blur-md "
        >

          {/* Glow */}
          <motion.div
            className="absolute -inset-1 rounded-lg opacity-0 group-hover:opacity-100"
            animate={{
              boxShadow: resumeHover
                ? "0 0 40px 20px rgba(96, 165, 250, 0.7)"
                : "0 0 0 0 rgba(96, 165, 250, 0)",
            }}
            transition={{ duration: 0.6 }}
          />

          {/* Content */}
          <div className="relative z-10 flex items-center gap-3">
            <motion.div
              animate={{
                rotate: resumeHover ? [0, -12, 12, 0] : 0,
                scale: resumeHover ? [1, 1.15, 1] : 1,
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

          {/* Shine */}
          <motion.div
            className="absolute inset-0 rounded-lg bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-0"
            animate={{
              opacity: resumeHover ? [0, 1, 0] : 0,
              x: resumeHover ? [-200, 200] : 0,
            }}
            transition={{ duration: 0.8, repeat: resumeHover ? Infinity : 0 }}
          />
        </motion.a>
      </div>

      {/* Scroll Indicator */}
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