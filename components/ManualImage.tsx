'use client';
import { gsap } from '@/functions/gsap';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
type Props = {
  image1: string;
  text1: string;
  compLogo: string;
  videoBG: string;
  fontSizeTime: number;
  showBackdrop: boolean;
  titleBarHider: boolean;
};

const ManualImage: React.FC<Props> = ({
  image1,
  text1,
  fontSizeTime,
  showBackdrop,
  compLogo,
  videoBG,
  titleBarHider,
}) => {
  const [size1, setSize1] = useState(0);
  const [size2, setSize2] = useState(0); 

  useEffect(() => {
    const logoEl = document.getElementById('logoDiv');
    console.log("animation starts")
    logoEl!.style.opacity = '0';
    gsap
      .timeline()
      .fromTo(
        logoEl,
        { scale:0.1, opacity: 0 },
        { scale:1, opacity:1, duration: 5 }
      );

    gsap.timeline().to(logoEl, {
      opacity: 0,
      scale:2,
      duration: 5,
      stagger:5
    })
  
      .then(() => {
         
      });
  
    // const timer = setTimeout(() => setAnimate(false), seconds * 1000);
    // return () => clearTimeout(timer);
  }, [image1, text1 ]);

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      setSize1(width > 1000 ? 15 : 25);
      setSize2(width > 1000 ? 28 : 24);
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
    
  }, []);

  let videoBGtrans = "";
  videoBGtrans =videoBG.includes("https:") ?`${videoBG.split('&playlist')[0]}&mute=1&playlist${
    videoBG.split('&playlist')[1]
  }` : videoBG;

  return (
    <div className="w-full h-full flex justify-start items-center relative">
      {videoBG.length>0 && videoBG.includes("https:")? <iframe
        className="w-full h-full"
        src={videoBGtrans}
        allow="autoplay;fullscreen;"
        frameBorder="0"
        allowFullScreen
      ></iframe>: <video
      src={videoBG}
      autoPlay
      muted
      loop
      className="w-full h-full object-cover"
    >
      <source src={videoBG} type="video/mp4" />
      Your browser does not support the video tag.
    </video>}
      <div className="absolute inset-0" style={{ backgroundImage:`url(${showBackdrop?`/images/backdrop.png`:""})`, backgroundPosition: 'center', backgroundSize: 'cover'}}></div>
      <div
        className={`absolute left-[5%] right-[5%] transition-opacity `}
        style={{top: `${fontSizeTime*1.3}px`, bottom: `${fontSizeTime*.3}px`}}
      >
        {image1 && (
          <div
            
            className={`h-full w-auto    z-10 bg-center bg-no-repeat bg-contain`}
            style={{
              backgroundImage: `url(${image1})`,
              boxShadow: '0 30px 40px rgba(0,0,0,.1)',
            }}
          ></div>
        )}

        {text1 && !titleBarHider && (
          <div
            className={`bg-purple-400 bg-opacity-70 absolute left-0 right-0 top-0`}
            style={{ height: `${size1}%` }}
          >
            <div className="flex justify-center h-full w-full items-center relative">
            <Image
              src={compLogo || '/images/backdrop.png'}
              width={128}
              height={128}
              className={` w-${size2} h-${size2} absolute top-2 left-2  `}
              alt="Company Logo"
              unoptimized
            />
            <p
              className="font-bold text-white text-6xl text-center"
              style={{
                textShadow: '5px 5px #C9AB78',
                fontFamily: 'DancingScript',
                zIndex: 100,
              }}
            >
              {text1}
            </p>
            </div>
          </div>
        )}
      </div>

      <div className="absolute inset-0 m-auto w-full h-full flex justify-center items-center">
        <div
        id="logoDiv"
          className={` w-[850px] h-[850px]  `}
        >
          <Image src={compLogo || '/images/backdrop.png'} width={850} height={850} className="h-full w-full" alt="Company Logo" unoptimized />
        </div>
      </div>
    </div>
  );
};

export default ManualImage;
