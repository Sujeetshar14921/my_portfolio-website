import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/types';
import ContactSection from '@/components/contact/ContactSection';

export default function ContactPage() {
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    supabase.from('profiles').select('*').limit(1).maybeSingle()
      .then(({ data }) => { if (data) setProfile(data as Profile); });
  }, []);

  return (
    <div className="pt-20">
      <ContactSection profile={profile} />
    </div>
  );
}
