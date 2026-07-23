import { motion } from 'framer-motion';
import { GraduationCap, Briefcase, Award } from 'lucide-react';
import { Profile, EducationEntry, ExperienceEntry } from '@/types';

interface AboutProps {
  profile: Profile | null;
}

function TimelineItem({ period, title, subtitle, description, icon: Icon }: {
  period: string; title: string; subtitle: string; description: string; icon: React.ElementType;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true }}
      className="flex gap-4 group"
    >
      <div className="flex flex-col items-center">
        <div className="w-9 h-9 rounded-full border border-surface-200 dark:border-white/10 bg-white dark:bg-surface-900 flex items-center justify-center text-surface-400 dark:text-surface-500 shrink-0 transition-colors group-hover:border-primary-600 dark:group-hover:border-primary-400 group-hover:text-primary-600 dark:group-hover:text-primary-400">
          <Icon size={15} />
        </div>
        <div className="w-px flex-1 bg-surface-200 dark:bg-white/10 mt-2" />
      </div>
      <div className="pb-8">
        <span className="text-xs font-mono uppercase tracking-wide text-primary-600 dark:text-primary-400">
          {period}
        </span>
        <h4 className="font-semibold text-surface-900 dark:text-white mt-1.5">{title}</h4>
        <p className="text-sm text-surface-500 dark:text-surface-400">{subtitle}</p>
        {description && (
          <p className="text-sm text-surface-600 dark:text-surface-400 mt-2 leading-relaxed">{description}</p>
        )}
      </div>
    </motion.div>
  );
}

export default function AboutSection({ profile }: AboutProps) {
  const education = (profile?.education || []) as EducationEntry[];
  const experience = (profile?.experience || []) as ExperienceEntry[];
  const achievements = profile?.achievements || [];

  return (
    <section id="about" className=" relative w-full py-16 bg-[url('/public/bgImg.svg')] bg-cover bg-center bg-no-repeat  ">
      <div className="w-full px-6 md:px-12 lg:px-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12"
        >
          <span className="block text-xs font-mono uppercase tracking-[0.2em] text-primary-600 dark:text-primary-400 mb-3">
            / About
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-surface-900 dark:text-white">
            About me
          </h2>
        </motion.div>

        {/* Large Horizontal Photo with Colorful Multi-Layer Border */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, rotate: -2 }}
          whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="mb-14 inline-block w-full"
        >
          <div className="relative w-full aspect-[16/9]">
            {/* Rotated color block behind */}
            <div
              className="absolute inset-0 -rotate-2 -z-10"
              style={{ backgroundColor: "#EA580C" }}
            />
            <div
              className="absolute inset-0 rotate-1 -z-10 translate-x-3 translate-y-3"
              style={{ backgroundColor: "#3A86FF" }}
            />

            {/* Main image */}
            <img
              src={profile?.photo_url || 'https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=800'}
              alt={profile?.name || 'Alex Morgan'}
              loading="lazy"
              className="w-full h-full object-cover border-4 border-white dark:border-surface-900 relative shadow-2xl"
            />
          </div>
        </motion.div>

        {/* Name, Role, Bio */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="mb-14 w-full"
        >
          <motion.h3
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl md:text-4xl font-bold text-surface-900 dark:text-white mb-2 tracking-tight"
          >
            {profile?.name || 'Name Not Found'}
          </motion.h3>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg text-primary-600 dark:text-primary-400 font-medium mb-6 flex items-center gap-2"
          >
            <span className="w-6 h-[2px] bg-primary-600 dark:bg-primary-400 inline-block" />
            {profile?.role || 'Roll Not Found'}
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="text-surface-600 dark:text-surface-400 leading-relaxed text-base md:text-lg w-full max-w-none"
          >
            {profile?.bio || 'Empty Bio'}
          </motion.p>
        </motion.div>

        {/* Achievements Grid */}
        {achievements.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16 pb-16 border-b border-surface-200 dark:border-white/10"
          >
            <span className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.2em] text-primary-600 dark:text-primary-400 mb-5">
              <Award size={14} /> Achievements &amp; Certifications
            </span>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {achievements.map((a, i) => (
                <span
                  key={i}
                  className="px-3 py-2.5 text-xs font-mono uppercase tracking-wide border border-surface-200 dark:border-white/10 text-surface-600 dark:text-surface-400 hover:border-primary-600 dark:hover:border-primary-400 transition-colors"
                >
                  {a}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* Timeline sections - 2 columns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
          {/* Experience */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.2em] text-primary-600 dark:text-primary-400 mb-8">
              <Briefcase size={14} /> Experience
            </span>
            <div className="space-y-4">
              {experience.map((exp, i) => (
                <TimelineItem
                  key={i}
                  period={exp.period}
                  title={exp.role}
                  subtitle={exp.company}
                  description={exp.description}
                  icon={Briefcase}
                />
              ))}
            </div>
          </motion.div>

          {/* Education */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.2em] text-primary-600 dark:text-primary-400 mb-8">
              <GraduationCap size={14} /> Education
            </span>
            <div className="space-y-4">
              {education.map((edu, i) => (
                <TimelineItem
                  key={i}
                  period={edu.year}
                  title={edu.degree}
                  subtitle={edu.institution}
                  description=""
                  icon={GraduationCap}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}