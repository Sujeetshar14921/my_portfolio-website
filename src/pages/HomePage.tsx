import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Profile, Project, Skill, BlogPost, Testimonial } from '@/types';
import HeroSection from '@/components/hero/HeroSection';
import AboutSection from '@/components/about/AboutSection';
import SkillsSection from '@/components/skills/SkillsSection';
import ProjectsSection from '@/components/projects/ProjectsSection';
import BlogSection from '@/components/blog/BlogSection';
import TestimonialsSection from '@/components/ui/TestimonialsSection';
import ContactSection from '@/components/contact/ContactSection';
import NewsletterSection from '@/components/ui/NewsletterSection';

export default function HomePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);

  useEffect(() => {
    async function load() {
      const [profileRes, projectsRes, skillsRes, postsRes, testimonialsRes] = await Promise.all([
        supabase.from('profiles').select('*').limit(1).maybeSingle(),
        supabase.from('projects').select('*').eq('published', true).order('sort_order'),
        supabase.from('skills').select('*').order('sort_order'),
        supabase.from('blog_posts').select('*').eq('published', true).order('published_at', { ascending: false }),
        supabase.from('testimonials').select('*').eq('published', true).order('sort_order'),
      ]);

      if (profileRes.data) setProfile(profileRes.data as Profile);
      if (projectsRes.data) setProjects(projectsRes.data as Project[]);
      if (skillsRes.data) setSkills(skillsRes.data as Skill[]);
      if (postsRes.data) setPosts(postsRes.data as BlogPost[]);
      if (testimonialsRes.data) setTestimonials(testimonialsRes.data as Testimonial[]);
    }
    load();
  }, []);

  return (
    <>
      <HeroSection profile={profile} />
      <AboutSection profile={profile} />
      <SkillsSection skills={skills} />
      <ProjectsSection projects={projects} />
      <TestimonialsSection testimonials={testimonials} />
      <BlogSection posts={posts} />
      <NewsletterSection />
      <ContactSection profile={profile} />
    </>
  );
}
