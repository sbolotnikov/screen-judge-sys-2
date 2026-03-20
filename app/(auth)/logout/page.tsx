'use client';
import { useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { PageWrapper } from '@/components/page-wrapper';

export default function LogoutPage() {
  useEffect(() => {
    const performLogout = async () => {
      // Redirect to home page after sign out
      await signOut({ callbackUrl: '/' });
    };
    performLogout();
  }, []);

  return (
    <PageWrapper className="flex items-center justify-center min-h-screen">
      <div className="text-center p-8 blurFilter bg-lightMainBG/70 dark:bg-darkMainBG/70 rounded-lg shadow-xl border border-lightMainColor dark:border-darkMainColor">
        <h1 className="text-2xl font-bold mb-4 text-lightMainColor dark:text-darkMainColor">Logging out...</h1>
        <p className="text-lightMainColor dark:text-darkMainColor">Please wait while we sign you out safely.</p>
        <div className="mt-6 flex justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-lightAccentColor dark:border-darkAccentColor"></div>
        </div>
      </div>
    </PageWrapper>
  );
}
