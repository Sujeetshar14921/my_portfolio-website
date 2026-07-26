import { motion, useAnimation, useReducedMotion } from "framer-motion";
import { useEffect } from "react";

export default function LoopSlider() {
  const items = Array.from({ length: 12 });
  const prefersReducedMotion = useReducedMotion();
  const controls = useAnimation();

  const startScroll = () =>
    controls.start({
      x: ["0%", "-50%"],
      transition: { duration: 22, repeat: Infinity, ease: "linear" },
    });

  useEffect(() => {
    if (!prefersReducedMotion) startScroll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefersReducedMotion]);

  return (
    <section className="relative w-full overflow-hidden bg-transparent">
      {/* fade the edges so text dissolves instead of hard-cutting */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 md:w-24 bg-gradient-to-r from-white dark:from-surface-950 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 md:w-24 bg-gradient-to-l from-white dark:from-surface-950 to-transparent" />

      <motion.div
        className="flex whitespace-nowrap"
        animate={controls}
        onHoverStart={() => !prefersReducedMotion && controls.stop()}
        onHoverEnd={() => !prefersReducedMotion && startScroll()}
      >
        {[...items].map((_, index) => (
          <h2
            key={index}
            className="mx-8 text-5xl md:text-7xl lg:text-9xl font-black uppercase tracking-wider flex-shrink-0"
          >
            <span className="text-primary-600 dark:text-primary-400">AI</span>{" "}
            <span className="text-surface-900 dark:text-white">FULL-STACK DEVELOPER</span>
          </h2>
        ))}
      </motion.div>
    </section>
  );
}