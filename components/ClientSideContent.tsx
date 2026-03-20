'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useDimensions } from '@/hooks/useDimensions';
import { useIsClient } from '@/hooks/useIsClient';
import { NoSSR } from '@/components/NoSSR'; 

function ClientSideContent() {
  const windowSize = useDimensions();
  const isClient = useIsClient();
  const [bigScreen, setBigScreen] = useState(false);

  useEffect(() => {
    if (isClient && windowSize.width !== undefined) {
      setBigScreen(windowSize.width > 700 && windowSize.height! > 560);
    }
  }, [windowSize.width, windowSize.height, isClient]);
  const departmentsArray = [
    {
      name: 'New Student Offer',
      path: '/images/new_offer.jpg',
      link: '/new_students',
    },
    { name: 'Calendar', path: '/images/calendar.jpg', link: '/calendar' },
  ];
  const ContainerLoaded = () => {
    function degrees_to_radians(degrees: number) {
      // Store the value of pi.
      const pi = Math.PI;
      // Multiply degrees by pi divided by 180 to convert to radians.
      return degrees * (pi / 180);
    }
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
    const windowSize = useDimensions();

    useEffect(() => {
      const container = document.getElementById('containerBig');
      if (container && isClient) {
        setContainerSize({
          width: container.offsetWidth,
          height: container.offsetHeight,
        });
      }
    }, [windowSize.width]);
    return (
      <div
        id="containerBig"
        className=" w-full h-full relative  flex justify-center items-center  overflow-auto "
      >
        {containerSize.width > 0 &&
          containerSize.height > 0 &&
          departmentsArray.map((item, index) => {
            return (
              <div
                key={'Links' + index}
                className="absolute flex flex-col justify-between items-center"
                style={{
                  top: `-${
                    Math.round(
                      containerSize.height! / departmentsArray.length
                    ) > 260
                      ? 130
                      : Math.round(
                          containerSize.height! / departmentsArray.length
                        )
                  }px`,
                  left: `-${
                    Math.round(containerSize.width! / departmentsArray.length) >
                    260
                      ? 130
                      : Math.round(containerSize.width! / 11)
                  }px`,
                }}
              >
                <Link
                  href={item.link}
                  className={`cards__item    p-2 max-w-[260px] flex flex-col justify-end  items-center  shadow-2xl shadow-lightMainColor dark:shadow-darkMainColor rounded-md border-2`}
                  style={
                    {
                      width:
                        Math.round(
                          containerSize.width! > containerSize.height!
                            ? containerSize.height! / 3.5
                            : containerSize.width! / 3.5
                        ) + 'px',
                      height:
                        Math.round(
                          containerSize.width! > containerSize.height!
                            ? containerSize.height! / 3.5
                            : containerSize.width! / 3.5
                        ) + 'px',

                      backgroundImage: `url(${item.path})`,
                      backgroundPosition: 'top',
                      backgroundSize: 'cover',
                      '--item-x':
                        Math.round(
                          (containerSize.width / 2.8) *
                            Math.cos(
                              degrees_to_radians(
                                (index * 360) / departmentsArray.length -
                                  22 -
                                  135
                              )
                            )
                        ) + 'px',
                      '--item-y':
                        Math.round(
                          ((containerSize.height - 50) /
                            (containerSize.height > containerSize.width
                              ? 2.5
                              : 2.5)) *
                            Math.sin(
                              degrees_to_radians(
                                (index * 360) / departmentsArray.length -
                                  22 -
                                  135
                              )
                            )
                        ) + 'px',
                    } as React.CSSProperties
                  }
                >
                  <div className="w-full rounded-md  text-xl  text-center   text-shadow  dark:text-shadow-light text-lightMainColor bg-lightMainBG/80  dark:text-darkMainColor dark:bg-darkMainBG/80  dark:shadow-darkMainColor">
                    {item.name}
                  </div>
                </Link>
              </div>
            );
          })}
        <div
          id="text"
          className="blurFilter absolute bottom-[27%]  centerOrigin bgGradientSize50 cards__item  flex flex-col justify-center items-center  text-lightMainColor bg-lightMainBG/60 dark:text-darkMainColor dark:bg-darkMainBG/60  shadow-2xl shadow-lightMainColor dark:shadow-darkMainColor rounded-md border-2"
        >
          <h1
            className={`font-bold   text-franceBlue  text-center font-DancingScript text-shadow  dark:text-shadow-light p-3 `}
            style={{ fontSize: `45px`, lineHeight: '0.75' }}
          >
            Screen Handler App
          </h1>
          <p
            className="text-center  text-shadow  dark:text-shadow-light"
            style={{ fontSize: `22px` }}
          >
            {' '}
            Make your screen moving <br /> with style!
          </p>

          <p className="text-center md:text-xl text-lg">
            Best viewed in fullscreen mode
          </p>
        </div>
      </div>
    );
  };
  const fallbackContent = (
    <div className="w-full h-full relative mb-12 md:mb-0 overflow-y-auto md:overflow-auto">
      <div className="absolute top-0 left-0 w-full min-h-full min-w-full flex flex-col justify-center items-center md:flex-row md:ml-12">
        {departmentsArray.map((item, index) => {
          return (
            <Link key={'Links' + index} href={item.link}>
              <div className="blurFilter w-[230px] m-3 p-2 flex flex-col justify-center items-center text-lightMainColor bg-lightMainBG/75 dark:text-darkMainColor dark:bg-darkMainBG/75 shadow-2xl shadow-lightMainColor dark:shadow-darkMainColor rounded-md border-2">
                <h1 className="text-2xl text-center text-shadow dark:text-shadow-light">
                  {item.name}
                </h1>
                <Image
                  className="rounded-md overflow-hidden"
                  src={item.path}
                  width={250}
                  height={250}
                  alt="Logo"
                />
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );

  return (
    <NoSSR fallback={fallbackContent}>
      <div className="w-full h-full relative mb-12 md:mb-0 overflow-y-auto md:overflow-auto">
        {bigScreen ? (
          <div className="w-full h-full absolute top-0 left-0">
            <ContainerLoaded />
          </div>
        ) : (
          <div className="absolute top-0 left-0 w-full min-h-full min-w-full flex flex-col justify-center items-center md:flex-row md:ml-12">
            {departmentsArray.map((item, index) => {
              return (
                <Link key={'Links' + index} href={item.link}>
                  <div className="blurFilter w-[230px] m-3 p-2 flex flex-col justify-center items-center text-lightMainColor bg-lightMainBG/75 dark:text-darkMainColor dark:bg-darkMainBG/75 shadow-2xl shadow-lightMainColor dark:shadow-darkMainColor rounded-md border-2">
                    <h1 className="text-2xl text-center text-shadow dark:text-shadow-light">
                      {item.name}
                    </h1>
                    <Image
                      className="rounded-md overflow-hidden"
                      src={item.path}
                      width={250}
                      height={250}
                      alt="Logo"
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </NoSSR>
  );
}
export default ClientSideContent;
