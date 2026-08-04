import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Project } from '@/types';
import ProjectsSection from '@/components/projects/ProjectsSection';
import PageSeo from '@/components/seo/PageSeo';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    supabase.from('projects').select('*').eq('published', true).order('sort_order')
      .then(({ data }) => { if (data) setProjects(data as Project[]); });
  }, []);

  return (
    <div className="pt-20">
      <PageSeo
        title="Projects | Sujeet Sharma"
        description="Explore selected full stack, frontend, and AI projects by Sujeet Sharma with case studies, live demos, and source links."
        canonicalPath="/projects"
        schema={{
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          name: 'Projects',
          url: 'https://www.sujeetsharma.in/projects',
        }}
      />
      <ProjectsSection projects={projects} />
    </div>
  );
}
