import { motion } from "framer-motion";
import { ArrowRight, Mail, Download, ArrowDown } from "lucide-react";
import { Link } from "react-router-dom";
import { Profile } from "@/types";
import { useState } from "react";

interface HeroProps {
  profile: Profile | null;
}

export default function HeroSection({ profile }: HeroProps) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [resumeHover, setResumeHover] = useState(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    });
  };

  const rotateX = isHovering ? (mousePosition.y - 0.5) * 20 : 0;
  const rotateY = isHovering ? (mousePosition.x - 0.5) * -20 : 0;

  return (
    <section
      className="relative w-full min-h-screen flex items-center justify-center overflow-hidden bg-surface-950"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Video Background */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
      >
        <source
          src="https://content.pexels.com/aigc-bundle/videos/8b3917b0-21e5-41cb-b724-0bd24bc3b5d1.mp4"
          type="video/mp4"
        />
      </video>

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/50 to-black/70" />

      {/* Decorative circles */}
      <div className="absolute top-0 right-[5%] w-96 h-96 border border-primary-200/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-[5%] w-96 h-96 border border-accent-200/5 rounded-full blur-3xl pointer-events-none" />

      {/*
        Main content wrapper:
        - px-4 on mobile, px-8 on md, px-12 on lg
        - pb-24 ensures scroll indicator never overlaps content
        - flex-col + items-center keeps everything centered and stacked
      */}
      <div className="relative z-10 w-full max-w-screen-xl mx-auto px-4 sm:px-8 lg:px-12 flex flex-col items-center justify-center pt-20 pb-28">

        {/* Status badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8 sm:mb-10 md:mb-12"
        >
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 border border-white/20 text-xs font-mono uppercase tracking-[0.1em] text-white/80">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75 animate-pulse" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span>Available for freelance</span>
          </div>
        </motion.div>

        {/* 3D Text Container */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="w-full mb-8 sm:mb-10 md:mb-12"
          style={{ perspective: "1200px" }}
        >
          <motion.div
            animate={{ rotateX, rotateY }}
            transition={{ type: "spring", stiffness: 100, damping: 20 }}
            style={{
              transformStyle: "preserve-3d" as const,
              transform: "perspective(1000px)",
            }}
            className="text-center"
          >
            {/* Name */}
            <div className="relative mb-4">
              <motion.h1
                className="
                  font-black uppercase leading-[0.9]
                  tracking-[-0.04em]
                  text-white
                  break-words
                  overflow-wrap-anywhere
                "
                style={{
                  /*
                    clamp(min, preferred, max)
                    — scales smoothly from ~320px to 1920px wide screens
                    — no hard breakpoints needed
                  */
                  fontSize: "clamp(2.4rem, 9vw, 11rem)",
                  textShadow: isHovering
                    ? `6px 6px 0px #3b82f6, 12px 12px 0px #8b5cf6, 18px 18px 0px #ec4899, 28px 28px 20px rgba(0,0,0,0.6)`
                    : `3px 3px 0px #3b82f6, 6px 6px 0px #8b5cf6, 10px 10px 0px #ec4899, 16px 16px 12px rgba(0,0,0,0.4)`,
                  transition: "text-shadow 0.4s ease",
                  fontFamily: "'Space Grotesk','Inter',sans-serif",
                  textRendering: "optimizeLegibility",
                  wordBreak: "break-word",
                  overflowWrap: "anywhere",
                }}
              >
                {profile?.name || "Sujeet Sharma"}
              </motion.h1>
            </div>

            {/* Role / Profession */}
            <motion.div
              className="relative"
              animate={{ y: isHovering ? -8 : 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
            >
              <h2
                className="
                  font-black leading-tight
                  tracking-[-0.03em]
                  break-words
                "
                style={{
                  fontSize: "clamp(1.5rem, 6vw, 6rem)",
                  wordBreak: "break-word",
                  overflowWrap: "anywhere",
                }}
              >
                <span
                  style={{
                    backgroundImage:
                      "linear-gradient(270deg,#00f5ff,#3b82f6,#8b5cf6,#ec4899,#f59e0b,#00f5ff)",
                    backgroundSize: "400% 400%",
                    animation: "gradientMove 8s ease infinite",
                    backgroundClip: "text",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    filter: isHovering
                      ? "drop-shadow(0 0 30px rgba(96,165,250,0.8))"
                      : "drop-shadow(0 0 15px rgba(96,165,250,0.4))",
                    transition: "filter 0.4s ease",
                    display: "block",
                  }}
                >
                  {profile?.role || "Full Stack Developer"}
                </span>
              </h2>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="
            text-center text-white/80
            mb-8 sm:mb-10 md:mb-12
            max-w-xl
            leading-relaxed
            drop-shadow-lg
            px-2
          "
          style={{ fontSize: "clamp(0.95rem, 2.5vw, 1.2rem)" }}
        >
          {profile?.tagline ||
            "Crafting digital experiences with clean code and thoughtful design"}
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex flex-wrap gap-3 sm:gap-4 justify-center mb-6 sm:mb-8 w-full"
        >
          <Link
            to="/projects"
            className="
              inline-flex items-center justify-center gap-2
              px-6 py-3 sm:px-7 sm:py-3.5
              bg-white text-black font-medium text-sm
              hover:bg-white/90 transition-all duration-300
              shadow-lg hover:shadow-xl
              whitespace-nowrap
            "
          >
            View My Work <ArrowRight size={16} />
          </Link>
          <Link
            to="/contact"
            className="
              inline-flex items-center justify-center gap-2
              px-6 py-3 sm:px-7 sm:py-3.5
              border-2 border-white text-white font-medium text-sm
              hover:bg-white hover:text-black transition-all duration-300
              whitespace-nowrap
            "
          >
            <Mail size={16} /> Let's Talk
          </Link>
        </motion.div>

        {/* Resume Button */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.5, type: "spring", stiffness: 200 }}
        >
          <a
            href={profile?.resume_url || "#"}
            onMouseEnter={() => setResumeHover(true)}
            onMouseLeave={() => setResumeHover(false)}
            className="group relative inline-flex items-center gap-3 px-7 py-4 overflow-hidden"
          >
            {/* Background animation */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-[length:200%_100%]"
              animate={{
                backgroundPosition: resumeHover ? ["100% 0", "0 0"] : "0 0",
              }}
              transition={{ duration: 0.8 }}
            />

            {/* Border glow */}
            <motion.div
              className="absolute inset-0 border-2 border-transparent rounded-sm pointer-events-none"
              animate={{
                boxShadow: resumeHover
                  ? ["0 0 0 0 rgba(96,165,250,0.8)", "0 0 30px 15px rgba(96,165,250,0)"]
                  : "0 0 0 0 rgba(96,165,250,0)",
              }}
              transition={{ duration: 0.8 }}
            />

            {/* Content */}
            <div className="relative z-10 flex items-center gap-3">
              <motion.div
                animate={{
                  rotate: resumeHover ? [0, -10, 10, 0] : 0,
                  scale: resumeHover ? [1, 1.1, 1] : 1,
                }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Download size={18} className="text-white" />
              </motion.div>

              <span className="text-white font-bold text-sm tracking-wider uppercase whitespace-nowrap">
                Download Resume
              </span>

              <motion.div
                animate={{ x: resumeHover ? [0, 4, 0] : 0 }}
                transition={{ duration: 0.6, repeat: resumeHover ? Infinity : 0 }}
              >
                <ArrowRight size={16} className="text-white" />
              </motion.div>
            </div>

            {/* Shine */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0"
              animate={{
                opacity: resumeHover ? [0, 0.4, 0] : 0,
                x: resumeHover ? [-100, 100] : 0,
              }}
              transition={{ duration: 0.8 }}
            />
          </a>
        </motion.div>
      </div>

      {/* Scroll indicator — absolute, won't overlap content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1 }}
        className="hidden md:flex absolute bottom-6 left-1/2 -translate-x-1/2 flex-col items-center gap-2 pointer-events-none"
      >
        <span className="text-xs font-mono uppercase tracking-[0.2em] text-white/50">
          Scroll to explore
        </span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="text-white/50"
        >
          <ArrowDown size={16} />
        </motion.div>
      </motion.div>
    </section>
  );
}