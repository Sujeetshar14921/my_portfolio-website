import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

type Spark = {
  x: number;
  y: number;
  id: number;
  life: number;
};

export default function CustomCursor() {
  const cursorRef = useRef({ x: 0, y: 0 });
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const [sparks, setSparks] = useState<Spark[]>([]);
  const sparksRef = useRef<Spark[]>([]);

  const idRef = useRef(0);
  const lastSparkTime = useRef(0);

  const [hovering, setHovering] = useState(false);
  const [clicked, setClicked] = useState(false);

  const isMobile =
    typeof window !== "undefined" ? window.innerWidth < 768 : false;

  // 👉 smooth cursor animation
  useEffect(() => {
    if (isMobile) return;

    let raf: number;

    const animate = () => {
      setPos((prev) => ({
        x: prev.x + (cursorRef.current.x - prev.x) * 0.18,
        y: prev.y + (cursorRef.current.y - prev.y) * 0.18,
      }));

      raf = requestAnimationFrame(animate);
    };

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [isMobile]);

  // 👉 mouse tracking
  useEffect(() => {
    if (isMobile) return;

    const move = (e: MouseEvent) => {
      cursorRef.current = { x: e.clientX, y: e.clientY };

      const now = performance.now();
      if (now - lastSparkTime.current > 20) {
        lastSparkTime.current = now;

        const newSpark: Spark = {
          x: e.clientX,
          y: e.clientY,
          id: idRef.current++,
          life: 1,
        };

        sparksRef.current = [...sparksRef.current.slice(-25), newSpark];
        setSparks(sparksRef.current);
      }
    };

    const down = () => setClicked(true);
    const up = () => setClicked(false);

    window.addEventListener("mousemove", move, { passive: true });
    window.addEventListener("mousedown", down);
    window.addEventListener("mouseup", up);

    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mousedown", down);
      window.removeEventListener("mouseup", up);
    };
  }, [isMobile]);

  // 👉 hover detection (optimized delegation)
  useEffect(() => {
    if (isMobile) return;

    const handlerEnter = () => setHovering(true);
    const handlerLeave = () => setHovering(false);

    const selector = "a, button, input, textarea, [data-cursor]";
    const elements = document.querySelectorAll(selector);

    elements.forEach((el) => {
      el.addEventListener("mouseenter", handlerEnter);
      el.addEventListener("mouseleave", handlerLeave);
    });

    return () => {
      elements.forEach((el) => {
        el.removeEventListener("mouseenter", handlerEnter);
        el.removeEventListener("mouseleave", handlerLeave);
      });
    };
  }, [isMobile]);

  if (isMobile) return null;

  return (
    <>
      {/* ✈️ Cursor */}
      <motion.div
        animate={{
          x: pos.x - 16,
          y: pos.y - 16,
          scale: clicked ? 0.75 : hovering ? 1.35 : 1,
        }}
        transition={{
          type: "spring",
          stiffness: 600,
          damping: 28,
        }}
        className="fixed top-0 left-0 z-[99999] pointer-events-none"
      >
        <svg
          width="40"
          height="40"
          viewBox="0 0 24 24"
          className="drop-shadow-[0_0_18px_rgba(255,120,0,0.9)]"
          style={{
            transform: "rotate(70deg)",
            transformOrigin: "bottom",
          }}
        >
          <path
            d="M2 12L22 3L14 12L22 21L2 12Z"
            fill={hovering ? "#38BDF8" : "#FFFFFF"}
            stroke="#2563EB"
            strokeWidth="1.2"
          />
        </svg>
      </motion.div>
    </>
  );
}