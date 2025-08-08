'use client';

import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useSupabase } from '@/providers/SupabaseProvider';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { session } = useSupabase();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (session !== undefined) {
      setIsLoading(false);
      if (!session) {
        router.push('/');
      }
    }
  }, [session, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return <>{children}</>;
}