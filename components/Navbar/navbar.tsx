'use client';
import { useState, useEffect, useContext, useMemo } from 'react';
import Link from 'next/link';
import NavItem from './navItem';
import Burger from './burger';
import { useSession } from 'next-auth/react';
import ShowIcon from '../svg/showIcon';
// import { signIn } from 'next-auth/react'; 
import { useRouter } from 'next/navigation';
import { SettingsContext } from '@/hooks/useSettings';
import { ScreenSettingsContextType } from '@/types/types';
import { useDimensions } from '@/hooks/useDimensions';
import ImgFromDb from '../ImgFromDb';

type Props = {
  path: string;
  locale?: string | undefined;
  children?: React.ReactNode;
};

const Navbar = ({ path, locale, children }: Props) => {
  const [style1, setStyle1] = useState({ display: 'none' });
  const [burgerState, setBurgerState] = useState(false);
   
  const router = useRouter();
  const { changeTheme, darkMode, hideNav } = useContext(
    SettingsContext
  ) as ScreenSettingsContextType;
  const { data: session } = useSession();
  const userImage = session?.user?.image ?? '';
  const userRole = (session?.user as { role?: string })?.role;
  const windowSize = useDimensions();

  const navbarLinks = useMemo(() => {
    if (!session) {
      return [
        {
          url: '/',
          title: 'Home',
          icon: 'Home',
        },
      ];
    }else if (userRole === 'Admin') { 
      return [
        {
          url: '/',
          title: 'Home',
          icon: 'Home',
        },

        {
          url: '/admin/dashboard',
          title: 'Dashboard',
          icon: 'Dashboard',
        },
        {
          url: '/logout',
          title: 'Logout',
          icon: 'Logout',
        },
      ];
    }
    return [
      {
        url: '/',
        title: 'Home',
        icon: 'Home',
      },
      {
        url: '/logout',
        title: 'Logout',
        icon: 'Logout',
      },
    ];
  }, [session]);
  const changeMenu = (isChangeOrientation: boolean) => {
    const items = document.querySelectorAll('.navbar__item');
    if (windowSize.width! < 768 && !isChangeOrientation) {
      if (burgerState) {
        document
          .getElementById('navBarContainer')
          ?.classList.add('translate-x-80');
        document.getElementById('navBarContainer')?.classList.add('delay-600');
      } else {
        document
          .getElementById('navBarContainer')
          ?.classList.remove('translate-x-80');
        document
          .getElementById('navBarContainer')
          ?.classList.remove('delay-600');
      }

      for (let i = 0; i < items.length; i++) {
        if (burgerState) {
          items[i].classList.add('translate-x-80');
        } else {
          items[i].classList.remove('translate-x-80');
        }
      }
      burgerState
        ? document.getElementById('theme-toggle')?.classList.add('hidden')
        : document.getElementById('theme-toggle')?.classList.remove('hidden');
      burgerState
        ? document.getElementById('profile-toggle')?.classList.add('hidden')
        : document.getElementById('profile-toggle')?.classList.remove('hidden');
      setBurgerState(!burgerState);
    }
    if (windowSize.height! < 760 && !isChangeOrientation) {
      for (let i = 0; i < items.length; i++) {
        if (burgerState) {
          items[i].classList.add('-translate-y-80');
        } else {
          items[i].classList.remove('-translate-y-80');
        }
      }

      burgerState
        ? document.getElementById('theme-toggle')?.classList.add('hidden')
        : document.getElementById('theme-toggle')?.classList.remove('hidden');
      burgerState
        ? document.getElementById('profile-toggle')?.classList.add('hidden')
        : document.getElementById('profile-toggle')?.classList.remove('hidden');
      setBurgerState(!burgerState);
    }
    if (
      isChangeOrientation &&
      (windowSize.height! < 680 || windowSize.width! < 768)
    ) {
      for (let i = 0; i < items.length; i++) {
        items[i].classList.remove('-translate-y-80');
        items[i].classList.remove('translate-x-80');
        if (windowSize.height! < 760) items[i].classList.add('-translate-y-80');
        if (windowSize.width! < 768)
          document
            .getElementsByClassName('navbar__list')[0]
            .classList.add('translate-x-80');
        document
          .getElementsByClassName('navbar__list')[0]
          .classList.add('delay-600');
      }

      document.getElementById('theme-toggle')?.classList.add('hidden');
      document.getElementById('profile-toggle')?.classList.add('hidden');
      setBurgerState(false);
    }
  };
  useEffect(() => {
    if (windowSize.width === undefined) {
      return;
    }

    if (windowSize.width < 768) {
      const items = document.querySelectorAll('.navbar__item');
      for (let i = 0; i < items.length; i++) {
        items[i].classList.add('translate-x-80');
      }
      document.getElementById('theme-toggle')?.classList.add('hidden');
      document.getElementById('locale-toggle')?.classList.add('hidden');
      document.getElementById('profile-toggle')?.classList.add('hidden');
    }

    const timeoutId = window.setTimeout(() => {
      changeMenu(true);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [windowSize.width]);
 

  return (
    <>
      <nav className="navbar fixed top-0 left-0 w-full z-[100] h-16 pointer-events-none">
        <div className="absolute inset-0 flex flex-col items-center justify-end z-[-5] pb-14 md:pb-0 pointer-events-none">
          <div className="logoTransform w-full h-full flex items-center justify-end opacity-20"></div>
        </div>

        <div
          className={`w-full flex flex-row justify-end md:justify-between pointer-events-auto ${
            hideNav ? 'hidden' : ''
          }`}
          style={{ height: '100%' }}
        >
        <ul
          id="navBarContainer"
          className="z-100 md:absolute md:top-2 md:left-0 blurFilterNav navbar__list bg-darkMainBG/25 translate-x-80 md:dark:bg-transparent md:bg-transparent dark:bg-lightMainBG/25 md:translate-x-0 transition  duration-1000 ease-in-out overflow-y-auto md:overflow-visible "
        >
          {navbarLinks.map((item, index) => {
            return (
              <li
                className={` navbar__item transition duration-300 ease-in-out`}
                style={{ transitionDelay: `${100 + index * 100}ms` }}
                key={index}
                onClick={() => changeMenu(false)}
              >
                <NavItem title={item.title} icon={item.icon} url={item.url} />
              </li>
            );
          })}
        </ul>

        <div
          className={`navbar__right_span z-100  
          }`}
        >
          {!session && (
            <button
              type="button"
              aria-label="login button"
              className="  h-6 w-6 mr-3 md:mr-6 md:h-8 md:w-8 rounded-sm outline-none"
              onClick={() => {
                router.push('/login');
              }}
            >
              <div className="group flex  cursor-pointer  hover:scale-110  flex-col items-center ">
                <div className=" h-6 w-6 md:h-8 md:w-8 fill-none rounded-full bg-lightMainBG dark:bg-lightMainColor p-1 group-hover:animate-bounce stroke-lightMainColor dark:stroke-darkMainColor ">
                  <ShowIcon icon={'Login'} stroke={'2'} />
                </div>
                <p className=" tracking-widest mx-3 rounded-md text-lightMainColor darkMainColor md:bg-lightMainBG md:dark:bg-lightMainColor md:dark:text-darkMainColor dark:text-darkMainColor  opacity-100 group-hover:inline-flex md:block  md:group-hover:opacity-100 ">
                  {'LogIn'}
                </p>
              </div>
            </button>
          )}
          {session && (
            <button
              id="profile-toggle"
              aria-label="profile-toggle"
              type="button"
              className="  rounded-full h-full  mr-3 md:mr-6 outline-none "
              onClick={() => {
                if (burgerState) {
                  changeMenu(false);
                }
              }}
            >
              <Link href={'/profile'}>
                <div className="group h-6 w-6 md:h-8 md:w-8 flex  cursor-pointer  hover:scale-110  flex-col items-center ">
                    {userImage ? (
                      <ImgFromDb
                        url={userImage}
                        stylings="object-fill rounded-full h-6 w-6 md:h-9 md:w-9"
                        alt="profile picture"
                      />
                    ) : ( 
                      <div className=" h-6 w-6 md:h-8 md:w-8 fill-none rounded-full bg-lightMainBG dark:bg-lightMainColor  stroke-lightMainColor dark:stroke-darkMainColor ">
                        <ShowIcon icon={'DefaultUser'} stroke={'2'} />
                      </div>
                    )} 
                  <p className="hidden tracking-widest mx-3 transition duration-300 ease-in-out opacity-100 rounded-md text-darkMainColor md:bg-lightMainBG md:dark:bg-lightMainColor md:dark:text-darkMainColor md:text-lightMainColor group-hover:inline-flex md:block md:opacity-0 md:group-hover:opacity-100 ">
                    {'Profile'}
                  </p>
                </div>
              </Link>
            </button>
          )}
          <button
            id="theme-toggle"
            aria-label="theme-toggle"
            type="button"
            onClick={() => {
              changeTheme(!darkMode);
              const htmlClassList =
                document.getElementsByTagName('html')[0].classList;
              if (!darkMode) {
                htmlClassList.add('dark');
              } else {
                htmlClassList.remove('dark');
              }
              if (burgerState) {
                changeMenu(false);
              }
            }}
            className=" h-6 w-6 md:h-8 md:w-8  mr-3 md:mr-6 rounded-sm outline-none"
          >
            <div className="group flex  cursor-pointer  hover:scale-110  flex-col items-center ">
              <div className="  h-6 w-6 md:h-8 md:w-8  group-hover:animate-bounce stroke-lightMainColor dark:stroke-darkMainColor ">
                <div className=" h-6 w-6 md:h-8 md:w-8 mr-2  fill-none rounded-full bg-lightMainBG dark:bg-lightMainColor p-1 stroke-lightMainColor dark:stroke-darkMainColor ">
                  {darkMode ? (
                    <ShowIcon icon={'LightTheme'} stroke={'2'} />
                  ) : (
                    <ShowIcon icon={'DarkTheme'} stroke={'2'} />
                  )}
                </div>
              </div>
              <p className="hidden tracking-widest mx-3 transition duration-300 ease-in-out rounded-md text-darkMainColor md:bg-lightMainBG md:dark:bg-lightMainColor md:dark:text-darkMainColor md:text-lightMainColor opacity-100 group-hover:inline-flex md:block md:opacity-0 md:group-hover:opacity-100 ">
                {darkMode ? 'Light' : 'Dark'}
              </p>
            </div>
          </button>

          <button
            id="burger-toggle"
            aria-label="burger-toggle"
            className={`relative m-1 flex cursor-pointer p-1.5  outline-none rounded-md hover:ring-2 bg-lightMainBG dark:bg-lightMainColor  hover:ring-lightAccentColor focus:ring-lightAccentColor dark:hover:ring-darkAccentColor dark:focus:ring-darkAccentColor ${
              windowSize.height! < 760 || windowSize.width! < 768
                ? ''
                : 'hidden'
            }`}
            onClick={() => changeMenu(false)}
          >
            <Burger status={burgerState} />
          </button>
        </div>
      </div>
    </nav>
    <main className={`pt-16 ${hideNav ? 'pt-0' : ''}`}>
      {children}
    </main>
    </>
  );
};

export default Navbar;
