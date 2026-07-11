import { motion, AnimatePresence } from "framer-motion";
import { Quote, X } from "lucide-react";
import { Testimonial } from "@/types";
import { useState } from "react";

interface TestimonialsProps {
  testimonials: Testimonial[];
}

export default function TestimonialsSection({
  testimonials,
}: TestimonialsProps) {
  const published = testimonials.filter((t) => t.published);

  const [selected, setSelected] = useState<Testimonial | null>(null);

  if (published.length === 0) return null;

  const row1 = [...published, ...published];
  const row2 = [...published].reverse();
  const row2Loop = [...row2, ...row2];

  const TestimonialCard = ({
    t,
    i,
  }: {
    t: Testimonial;
    i: number;
  }) => (
    <motion.div
      key={`${t.id}-${i}`}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      whileHover={{ y: -5 }}
      viewport={{ once: true }}
      transition={{ delay: i * 0.05 }}
      onClick={() => setSelected(t)}
      className="flex-shrink-0 w-[340px] cursor-pointer"
    >
      {/* UI SAME */}
      <div className="flex flex-col h-full border border-surface-200 dark:border-white/10 p-6 md:p-8">
        <Quote
          size={20}
          className="text-surface-300 dark:text-surface-700 mb-4 shrink-0"
        />

        <p className="text-sm text-surface-600 dark:text-surface-400 leading-relaxed flex-1">
          &ldquo;{t.content}&rdquo;
        </p>

        <div className="flex items-center gap-3 mt-6 pt-6 border-t border-surface-100 dark:border-white/5">
          <img
            src={
              t.avatar_url ||
              "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100"
            }
            alt={t.name}
            className="w-10 h-10 rounded-full object-cover border border-surface-200 dark:border-white/10 shrink-0"
          />

          <div>
            <div className="text-sm font-semibold text-surface-900 dark:text-white">
              {t.name}
            </div>

            <div className="text-xs font-mono uppercase tracking-wide text-surface-400 dark:text-surface-500">
              {t.role}
              {t.company ? `, ${t.company}` : ""}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <section className="section-padding overflow-hidden bg-[url('/public/bgImg.svg')] bg-cover bg-center bg-no-repeat">
      <div className="w-full md:px-12 lg:px-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-14"
        >
          <span className="block text-xs font-mono uppercase tracking-[0.2em] text-primary-600 dark:text-primary-400 mb-3">
            / Testimonials
          </span>

          <h2 className="text-3xl md:text-4xl font-bold text-surface-900 dark:text-white">
            What people say
          </h2>
        </motion.div>

        {/* Netflix Style Marquee */}
        <div className="overflow-hidden space-y-8">
          {/* Row 1 */}
          <motion.div
            animate={{
              x: ["0%", "-50%"],
            }}
            transition={{
              duration: 35,
              ease: "linear",
              repeat: Infinity,
            }}
            className="flex gap-8 w-max"
          >
            {row1.map((t, i) => (
              <TestimonialCard
                key={`row1-${t.id}-${i}`}
                t={t}
                i={i}
              />
            ))}
          </motion.div>

          {/* Row 2 */}
          <motion.div
            animate={{
              x: ["-50%", "0%"],
            }}
            transition={{
              duration: 35,
              ease: "linear",
              repeat: Infinity,
            }}
            className="flex gap-8 w-max"
          >
            {row2Loop.map((t, i) => (
              <TestimonialCard
                key={`row2-${t.id}-${i}`}
                t={t}
                i={i}
              />
            ))}
          </motion.div>
        </div>
      </div>

      {/* Popup */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelected(null)}
            className="fixed inset-0 z-[9999] bg-black/70 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <motion.div
              initial={{
                opacity: 0,
                scale: 0.8,
              }}
              animate={{
                opacity: 1,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                scale: 0.8,
              }}
              transition={{
                type: "spring",
                stiffness: 120,
              }}
              onClick={(e) => e.stopPropagation()}
              className="
                relative
                w-full
                max-w-4xl
                bg-white
                dark:bg-surface-900
                border
                border-surface-200
                dark:border-white/10
                p-10
              "
            >
              <button
                onClick={() => setSelected(null)}
                className="absolute top-5 right-5"
              >
                <X size={20} />
              </button>

              <Quote
                size={40}
                className="text-surface-300 dark:text-surface-700 mb-6"
              />

              <p className="text-xl leading-relaxed text-surface-700 dark:text-surface-300 mb-8">
                &ldquo;{selected.content}&rdquo;
              </p>

              <div className="flex items-center gap-4">
                <img
                  src={
                    selected.avatar_url ||
                    "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100"
                  }
                  alt={selected.name}
                  className="w-20 h-20 rounded-full object-cover"
                />

                <div>
                  <h3 className="text-2xl font-bold text-surface-900 dark:text-white">
                    {selected.name}
                  </h3>

                  <p className="text-surface-500 dark:text-surface-400">
                    {selected.role}
                    {selected.company ? `, ${selected.company}` : ""}
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}