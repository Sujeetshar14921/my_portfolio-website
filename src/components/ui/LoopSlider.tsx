import { motion } from "framer-motion";

export default function LoopSlider() {
  const items = Array.from({ length: 12 });

  return (
    <section className="w-full overflow-hidden bg-transparent">
      <motion.div
        className="flex whitespace-nowrap"
        animate={{ x: ["0%", "-50%"] }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        {[...items].map((_, index) => (
          <h2
            key={index}
            className="mx-8 text-5xl md:text-7xl lg:text-9xl font-black uppercase tracking-wider flex-shrink-0"
          >
            <span className="text-blue-600">AI</span>{" "}
            <span className="text-orange-600">FULL-STACK DEVELOPER</span>
          </h2>
        ))}
      </motion.div>
    </section>
  );
}