import { motion, useScroll, useSpring } from 'framer-motion';

export default function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 24, mass: 0.2 });

  return (
    <motion.div
      aria-hidden="true"
      className="fixed left-0 top-0 z-[60] h-0.5 w-full origin-left bg-primary-600 dark:bg-primary-400"
      style={{ scaleX }}
    />
  );
}