import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/types';

interface ProfileContextValue {
  profile: Profile | null;
  loading: boolean;
  refresh: () => void;
}

const ProfileContext = createContext<ProfileContextValue>({
  profile: null,
  loading: true,
  refresh: () => {},
});

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const { data } = await supabase.from('profiles').select('*').limit(1).maybeSingle();
    setProfile(data as Profile | null);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  return (
    <ProfileContext.Provider value={{ profile, loading, refresh: load }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  return useContext(ProfileContext);
}
