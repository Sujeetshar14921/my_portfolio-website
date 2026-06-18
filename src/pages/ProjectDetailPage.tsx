import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Project } from '@/types';
import ProjectDetail from '@/components/projects/ProjectDetail';

export default function ProjectDetailPage() {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    supabase.from('projects').select('*').eq('published', true)
      .then(({ data }) => { if (data) setProjects(data as Project[]); });
  }, []);

  return <ProjectDetail projects={projects} />;
}
