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
    <section id="about" className=" relative w-full py-16 bg-[url('./public/bgImg.svg')] bg-cover bg-center bg-no-repeat  ">
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
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mb-14 inline-block w-full"
        >
          <div
            className="w-full aspect-[16/9] relative"
            style={{
              boxShadow: `
                -8px -8px 0px 0px #FF006E,
                -16px -16px 0px 0px #FB5607,
                -24px -24px 0px 0px #FFBE0B,
                8px 8px 0px 0px #8338EC,
                16px 16px 0px 0px #3A86FF,
                24px 24px 0px 0px #06FFA5,
                -8px 8px 0px 0px #FF5D00,
                8px -8px 0px 0px #FF0080
              `,
            }}
          >
            <img
              src={profile?.photo_url || 'https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=800'}
              alt={profile?.name || 'Alex Morgan'}
              loading="lazy"
              className="w-full h-full object-cover border border-surface-200 dark:border-white/10"
            />
          </div>
        </motion.div>

        {/* Name, Role, Bio */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-14 max-w-3xl"
        >
          <h3 className="text-3xl md:text-4xl font-bold text-surface-900 dark:text-white mb-2">
            {profile?.name || 'Alex Morgan'}
          </h3>
          <p className="text-lg text-primary-600 dark:text-primary-400 font-medium mb-6">
            {profile?.role || 'Full Stack Developer'}
          </p>
          <p className="text-surface-600 dark:text-surface-400 leading-relaxed text-base">
            {profile?.bio || ''}
          </p>
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