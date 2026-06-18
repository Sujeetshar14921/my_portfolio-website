import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Project } from '@/types';
import ProjectsSection from '@/components/projects/ProjectsSection';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    supabase.from('projects').select('*').eq('published', true).order('sort_order')
      .then(({ data }) => { if (data) setProjects(data as Project[]); });
  }, []);

  return (
    <div className="pt-20">
      <ProjectsSection projects={projects} />
    </div>
  );
}
