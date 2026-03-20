 'use client';
import {
  ScreenSettingsContextType,
 
} from '@/types/types';
import { createContext, useState } from 'react';
type Props = {
  children?: React.ReactNode;
};
export const SettingsContext = createContext<ScreenSettingsContextType | null>(
  null
);

export const SettingsProvider = ({ children }: Props) => {
  const [darkMode, setDarkMode] = useState(false);
  const [hideNav, setHideNav] = useState(false);     
  const changeTheme = (theme: boolean) => {
    setDarkMode(theme);
  };
  const changeNav = (nav: boolean) => {
    setHideNav(nav);
  };
  // useEffect(() => {
  //   fetch('/api/settings', {
  //     method: 'GET',
  //     headers: {
  //       'Content-Type': 'application/json',
  //     },
  //   })
  //     .then((response) => response.json())
  //     .then((data) => {
           
  //       console.log(data);   
  //     })
  //     .catch((error) => {
  //       console.log(error);
  //     });
  // }, []);
  return (
    <SettingsContext.Provider
      value={{
        darkMode,
        changeTheme,
        hideNav,
        changeNav,
  
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};
