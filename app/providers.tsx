'use client';

import { SettingsProvider } from '@/hooks/useSettings';
import { SessionProvider } from 'next-auth/react';
import Navbar from '@/components/Navbar/navbar';
 
type Props = {
  children?: React.ReactNode;
};

export const Providers = ({ children }: Props) => {
  return (
    <SessionProvider> 
        <SettingsProvider>
          <main
            id="mainPage"
            className="fixed w-screen h-svh p-0 m-0 items-center justify-center overflow-hidden text-lightMainColor dark:text-darkMainColor bg-lightMainBG dark:bg-darkMainBG"
          >
            <Navbar path={'/'} locale={'EN'}>
              {children}
            </Navbar>
          </main>

        </SettingsProvider>
      
    </SessionProvider>
  );
};
