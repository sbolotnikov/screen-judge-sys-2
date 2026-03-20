import type {Metadata} from 'next';
import './globals.css'; // Global styles
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'Dance Judge Pro App',
  description: 'This platform manages all visual screens at ballroom dance competitions, delivering synchronized heat lists, schedules, timers, and announcements across the venue. It ensures organizers, dancers, and audiences always see the right information at the right moment, keeping the entire event running smoothly and elegantly. on Next js and MongoDB',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
