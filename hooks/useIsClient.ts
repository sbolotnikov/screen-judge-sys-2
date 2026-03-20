'use client';
import { useEffect, useState } from 'react';

export const useIsClient = () => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Use setTimeout to avoid the direct setState warning
    const timer = setTimeout(() => setIsClient(true), 0);
    return () => clearTimeout(timer);
  }, []);

  return isClient;
};
