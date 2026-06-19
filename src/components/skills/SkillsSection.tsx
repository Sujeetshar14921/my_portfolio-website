import { motion } from "framer-motion";
import { Skill } from "@/types";

interface SkillsProps {
  skills: Skill[];
}

const categoryLabels: Record<string, string> = {
  frontend: "Frontend",
  backend: "Backend",
  tools: "Tools & DevOps",
  soft: "Soft Skills",
};

export default function SkillsSection({ skills }: SkillsProps) {
  const grouped = skills.reduce<Record<string, Skill[]>>((acc, skill) => {
    const cat = skill.category;

    if (!acc[cat]) acc[cat] = [];

    acc[cat].push(skill);

    return acc;
  }, {});

  const categories = Object.keys(grouped);

  return (
    <section
      id="skills"
      className="section-padding bg-white dark:bg-surface-950 transition-colors duration-300"
    >
      <div className="w-full md:px-12 lg:px-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-14"
        >
          <span className="block text-xs font-mono uppercase tracking-[0.2em] text-primary-600 dark:text-primary-400 mb-3">
            / Skills
          </span>

          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-surface-900 dark:text-white">
            Stack &amp; Expertise
          </h2>

          <p className="mt-4 text-surface-500 dark:text-surface-400 max-w-xl">
            Tools I reach for daily. Comfort level varies — happy to expand on
            any of these in a call.
          </p>
        </motion.div>

        {/* Parent Square Structure - No Background Color */}
        <div
          className="
            grid grid-cols-1 md:grid-cols-2
            overflow-hidden
            border border-surface-200
            dark:border-white/10
          "
        >
          {categories.map((category, idx) => {
            const isLeftCol = idx % 2 === 0;
            const isRow0 = idx < 2;

            return (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08 }}
                className={[
                  `
                  p-8 md:p-10
                  transition-colors duration-300
                  `,
                  idx === 0 ? "" : "border-t",
                  !isRow0 ? "md:border-t" : "",
                  isLeftCol ? "md:border-r" : "",
                  "border-surface-200 dark:border-white/10",
                ].join(" ")}
              >
                <h3 className="text-xs font-semibold tracking-[0.2em] uppercase text-primary-600 dark:text-primary-400 mb-7">
                  {categoryLabels[category] || category}
                </h3>

                <ul>
                  {grouped[category].map((skill, i) => (
                    <motion.li
                      key={skill.id}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.05 }}
                      className="
                        group
                        flex items-baseline gap-4
                        px-4 py-3
                        mb-3
                        last:mb-0
                        rounded-sm
                        border border-surface-200
                        dark:border-white/10
                        transition-all duration-300
                        hover:border-primary-400/30
                        hover:translate-x-1
                      "
                    >
                      <span className="text-xs font-mono tabular-nums text-surface-500 dark:text-surface-400 w-6 shrink-0">
                        {String(i + 1).padStart(2, "0")}
                      </span>

                      <span className="text-base font-medium text-surface-800 dark:text-surface-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        {skill.name}
                      </span>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}