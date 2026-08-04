import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/types';
import ContactSection from '@/components/contact/ContactSection';
import PageSeo from '@/components/seo/PageSeo';

export default function ContactPage() {
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    supabase.from('profiles').select('*').limit(1).maybeSingle()
      .then(({ data }) => { if (data) setProfile(data as Profile); });
  }, []);

  return (
    <div className="pt-20">
      <PageSeo
        title="Contact | Sujeet Sharma"
        description="Contact Sujeet Sharma for freelance web development, product builds, and collaboration opportunities."
        canonicalPath="/contact"
      />
      <ContactSection profile={profile} />
    </div>
  );
}
