'use client';
import { ReactNode, useEffect, useState } from 'react';

interface NoSSRProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export const NoSSR = ({ children, fallback = null }: NoSSRProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
