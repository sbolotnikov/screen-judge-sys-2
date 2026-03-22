'use client';
import React, { useContext, useEffect, useRef, useState, useMemo } from 'react';
// Note: Some imports and components might need to be adjusted or replaced
// for a web-based React application
import VideoPlayingComponent from './VideoPlayingComponent';
import ManualImage from './ManualImage';
import AutoImages from './AutoImages';
import FullAutoMode from './FullAutoMode';
import { SettingsContext } from '@/hooks/useSettings';
import { EventData, ScreenSettingsContextType } from '@/types/types';
import { useDimensions } from '@/hooks/useDimensions';
import svgPath from './svgPath';
import ImgFromDb from '@/components/ImgFromDb';
import FrameOnFire from '@/components/FrameOnFire';
import FrameRunnerEffect from '@/components/FrameRunnerEffect';
import AnimatedTextMessage from '@/components/AnimatedTextMessage';
import FrameGlow from '@/components/FrameGlow';
import TablePage from './TablePage';
import AutoTableMode from './AutoTableMode';
import DisplayCompResults from './DisplayCompResults';

type Props = {
  videoUri: { link: string; name: string };
  button1: string;
  compName: string;
  heatNum: string;
  image: string;
  mode: string;
  fontName: string;
  message2: string;
  fontSize2: number;
  fontSize: number;
  fontSizeTime: number;
  frameStyle: string;
  seconds: number;
  manualPicture: { link: string; name: string };
  displayedPicturesAuto: { link: string; name: string }[];
  displayedPictures: { link: string; name: string; dances: string[] }[];
  displayedVideos: { link: string; dances: string[] }[];
  vis: boolean;
  compLogo: { link: string; name: string };
  message: string;
  titleBarHider: boolean;
  showUrgentMessage: boolean;
  showTable: boolean;
  tablePages: {
    name: string;
    tableRows: string[];
    rowsPictures: string[] | undefined;
    rowsChecked: boolean[];
  }[];
  tableChoice: number;
  showHeatNumber: boolean;
  textColor: string;
  colorBG: string;
  animationSpeed: number;
  speedVariation: number;
  particleCount: number;
  maxSize: number;
  animationOption: number;
  rainAngle: number;
  originX: number;
  originY: number;
  particleTypes: string[];
  heat: string;
  showBackdrop: boolean;
  showSVGAnimation: boolean;
  unmuteVideos: boolean;
  events: EventData[];
  eventID: string;
  selectedDanceId: string;
  onReturn: (submitten: string) => void;
  onRenewInterval: () => void;
};

const ShowPlayingModal: React.FC<Props> = ({
  videoUri,
  button1,
  image,
  heatNum,
  mode,
  fontName,
  fontSize,
  fontSizeTime,
  fontSize2,
  frameStyle,
  seconds,
  manualPicture,
  displayedPicturesAuto,
  displayedPictures,
  displayedVideos,
  vis,
  compLogo,
  message,
  message2,
  titleBarHider,
  showUrgentMessage,
  showTable,
  tablePages,
  tableChoice,
  showHeatNumber,
  showBackdrop,
  textColor,
  colorBG,
  animationSpeed,
  speedVariation,
  particleCount,
  maxSize,
  animationOption,
  rainAngle,
  originX,
  originY,
  showSVGAnimation,
  particleTypes,
  unmuteVideos,
  heat,
  events,
  eventID,
  selectedDanceId,
  onReturn,
  onRenewInterval,
}) => {
  const { changeNav } = useContext(
    SettingsContext,
  ) as ScreenSettingsContextType;

  const windowSize = useDimensions();
  const handleSubmit = (e: React.MouseEvent, submitten: string) => {
    e.preventDefault();
    changeNav(true);
    onReturn(submitten);
  };
  const svgRef = useRef<SVGSVGElement>(null);
  const [timeNow, setTimeNow] = useState('');
  const [refreshVar, setRefreshVar] = useState(false);

  const { randomAnimationOption, randomRainAngle } = useMemo(() => {
    if (mode === 'Auto Full') {
      const seed = `${message}-${mode}`;
      let hash = 0;
      for (let i = 0; i < seed.length; i++) {
        hash = (hash << 5) - hash + seed.charCodeAt(i);
        hash |= 0;
      }
      const pseudoRandom1 = Math.abs(Math.sin(hash));
      const pseudoRandom2 = Math.abs(Math.cos(hash));
      
      return {
        randomAnimationOption: Math.floor((pseudoRandom1 - Math.floor(pseudoRandom1)) * 4) + 1,
        randomRainAngle: Math.floor((pseudoRandom2 - Math.floor(pseudoRandom2)) * 360)
      };
    }
    return { randomAnimationOption: null, randomRainAngle: null };
  }, [message, mode]);

  const animationSpeed1 = animationSpeed;
  const speedVariation1 = speedVariation;
  const particleCount1 = particleCount;
  const maxSize1 = maxSize;
  const animationOption1 = randomAnimationOption ?? animationOption;
  const rainAngle1 = randomRainAngle ?? rainAngle;
  const originX1 = originX;
  const originY1 = originY;
  const showSVGAnimation1 = showSVGAnimation;
  const particleTypes1 = particleTypes;

  const picArrAutoMode = useMemo(() => {
    if (mode === 'Auto Full' && displayedPictures.length > 0) {
      const arr1 = displayedPictures
        .map((pic) => ({ link: pic.link, dances: pic.dances }))
        .filter(
          (pic) => pic.dances !== null && pic.dances.indexOf(message) >= 0,
        );
      const arr2 = displayedPictures
        .map((pic) => ({ link: pic.link, dances: pic.dances }))
        .filter((pic) => pic.dances !== null && pic.dances.indexOf('All') >= 0);
      return arr1.concat(arr2);
    }
    return [];
  }, [message, mode, displayedPictures]);

  const videoArrAutoMode = useMemo(() => {
    if (mode === 'Auto Full' && displayedVideos.length > 0) {
      const videoArr1 = displayedVideos.filter(
        (vid) => vid.dances !== null && vid.dances.indexOf(message) >= 0,
      );
      const videoArr2 = displayedVideos.filter(
        (vid) => vid.dances !== null && vid.dances.indexOf('All') >= 0,
      );
      return videoArr1.concat(videoArr2);
    }
    return [];
  }, [message, mode, displayedVideos]);

  useEffect(() => {
    const r = document.querySelector(':root') as HTMLElement;
    r.style.setProperty('--animation-color', textColor);
  }, [textColor]);

  useEffect(() => {
    const timerInterval = setInterval(() => {
      const now = new Date();
      const currentDateTime = now.toLocaleString();
      console.log();
      setTimeNow(
        currentDateTime.split(',')[1].split(' ')[1].slice(0, -3) +
          ' ' +
          currentDateTime.split(',')[1].split(' ')[2],
      );
    }, 60000);
    !vis ? changeNav(false) : changeNav(true);
    return () => clearInterval(timerInterval);
  }, [vis, refreshVar, changeNav]);

  const gradientStyle = {
    background:
      colorBG !== undefined
        ? colorBG
        : 'linear-gradient(to right, #183657, #A7C9E7, #C8F1F6, #183657, #A7C9E7, #C8F1F6, #183657, #A7C9E7, #C8F1F6)',
  };
  // white, red, blue, red, white
  // "conic-gradient(at 40% 20%,#183657,#A7C9E7,#C8F1F6,#183657,#A7C9E7,#C8F1F6,#183657,#A7C9E7,#C8F1F6)"
  useEffect(() => {
    const svg = svgRef.current;

    if (svg && windowSize.width! > 0) {
      // Set SVG viewport and size explicitly
      svg.setAttribute('width', `${windowSize.width}`);
      svg.setAttribute('height', `${windowSize.height}`);
      svg.setAttribute(
        'viewBox',
        `0 0 ${windowSize.width} ${windowSize.height}`,
      );

      // Clear any existing transforms
      svg.setAttribute('transform', '');
      const svgNS = 'http://www.w3.org/2000/svg';

      const createParticle = (
        num1: number,
        peakX: number | null,
        peakY: number | null,
        startX0: number | null,
        startY0: number | null,
      ) => {
        const particle = document.createElementNS(svgNS, 'path');
        const animateMotion = document.createElementNS(svgNS, 'animateMotion');
        const animateOpacity = document.createElementNS(svgNS, 'animate');
        const animateTransform = document.createElementNS(
          svgNS,
          'animateTransform',
        );
        const animateTransform2 = document.createElementNS(
          svgNS,
          'animateTransform',
        );
        const animateColor = document.createElementNS(svgNS, 'animate');

        const shape =
          particleTypes1[Math.floor(Math.random() * particleTypes1.length)];
        const size =
          animationOption1 === 2 ? maxSize1 : Math.random() * maxSize1;

        particle.setAttribute('d', svgPath(shape));
        particle.setAttribute('fill', `hsl(${Math.random() * 360}, 100%, 50%)`);
        particle.setAttribute('fillRule', `evenodd`);
        particle.setAttribute('clipRule', `evenodd`);

        let startX, startY, endX, endY;
        const particleSpeed =
          animationSpeed1 * (1 + (Math.random() - 0.5) * speedVariation1);
        if (animationOption1 === 1 || animationOption1 === 2) {
          const edge = Math.floor(Math.random() * 4);
          if (animationOption1 === 1) {
            [startX, startY] = [originX1, originY1];
            [endX, endY] =
              edge === 0
                ? [Math.random() * windowSize.width!, windowSize.height!]
                : edge === 1
                  ? [Math.random() * windowSize.width!, 0]
                  : edge === 2
                    ? [0, Math.random() * windowSize.height!]
                    : [windowSize.width!, Math.random() * windowSize.height!];
          } else {
            [endX, endY] = [originX1, originY1];
            [startX, startY] =
              edge === 0
                ? [Math.random() * windowSize.width!, windowSize.height!]
                : edge === 1
                  ? [Math.random() * windowSize.width!, 0]
                  : edge === 2
                    ? [0, Math.random() * windowSize.height!]
                    : [windowSize.width, Math.random() * windowSize.height!];
          }
        } else if (animationOption1 === 4) {
          startX = Math.random() * windowSize.width!;
          startY = Math.random() * windowSize.height!;
          endX = Math.random() * windowSize.width!;
          endY = Math.random() * windowSize.height!;

          const animationDuration = 10 / animationSpeed1;
          const randomDelay = Math.random() * animationDuration;

          animateMotion.setAttribute(
            'path',
            `M${startX},${startY} L${endX},${endY}`,
          );
          animateMotion.setAttribute('dur', `${animationDuration}s`);
          animateMotion.setAttribute('begin', `${randomDelay}s`);

          animateTransform2.setAttribute('attributeName', 'transform');
          animateTransform2.setAttribute('type', 'scale');
          animateTransform2.setAttribute('from', '0');
          animateTransform2.setAttribute('to', `${size / 6}`);
          animateTransform2.setAttribute('dur', `${10 / particleSpeed}s`);
          animateTransform2.setAttribute('begin', `${randomDelay}s`);
          animateTransform2.setAttribute('repeatCount', 'indefinite');
          animateTransform2.setAttribute('additive', 'sum');

          animateTransform.setAttribute('attributeName', 'transform');
          animateTransform.setAttribute('type', 'rotate');
          animateTransform.setAttribute('from', '0 50 20');
          animateTransform.setAttribute('to', '360 270 360');
          animateTransform.setAttribute('dur', `${animationDuration}s`);
          animateTransform.setAttribute('begin', `${randomDelay}s`);
          animateTransform.setAttribute('repeatCount', 'indefinite');
          animateTransform.setAttribute('additive', 'sum');

          animateOpacity.setAttribute('attributeName', 'opacity');
          animateOpacity.setAttribute('values', '0;1;1;0');
          animateOpacity.setAttribute('keyTimes', '0;0.1;0.9;1');
          animateOpacity.setAttribute('dur', `${animationDuration}s`);
          animateOpacity.setAttribute('begin', `${randomDelay}s`);
          animateOpacity.setAttribute('repeatCount', 'indefinite');

          animateColor.setAttribute('attributeName', 'fill');
          animateColor.setAttribute('dur', '5s');
          animateColor.setAttribute('begin', `${randomDelay}s`);
          animateColor.setAttribute('repeatCount', 'indefinite');
          animateColor.setAttribute(
            'values',
            'hsl(0, 100%, 50%); hsl(60, 100%, 50%); hsl(120, 100%, 50%); hsl(180, 100%, 50%); hsl(240, 100%, 50%); hsl(300, 100%, 50%); hsl(24, 80%, 50%)',
          );
          animateColor.setAttribute('calcMode', 'discrete');
          particle.appendChild(animateTransform2);
          particle.appendChild(animateOpacity);
        } else if (animationOption1 === 3) {
          const angle = (rainAngle1 * Math.PI) / 180;
          startX = Math.random() * windowSize.width!;
          startY = Math.random() * windowSize.height!;
          endX = startX + Math.cos(angle) * windowSize.height!;
          endY = startY + Math.sin(angle) * windowSize.height!;
          animateTransform.setAttribute('attributeName', 'transform');
          animateTransform.setAttribute('type', 'scale');
          animateTransform.setAttribute('from', '0');
          animateTransform.setAttribute('to', `${size / 6}`);
          animateTransform.setAttribute('dur', `${10 / particleSpeed}s`);
          animateTransform.setAttribute('repeatCount', 'indefinite');
        }

        if (
          animationOption1 === 1 ||
          animationOption1 === 2 ||
          animationOption1 === 3
        ) {
          animateMotion.setAttribute(
            'path',
            `M${startX},${startY} L${endX},${endY}`,
          );
        }
        if (animationOption1 === 5) {
          // redo with State

          const angle = (2 * Math.PI * num1) / particleCount;
          const distance = 100 + Math.random() * 50;
          const endX = peakX! + Math.cos(angle) * distance;
          const endY = peakY! + Math.sin(angle) * distance;

          const controlX = peakX! + (endX - peakX!) * 0.5;
          const controlY = peakY! + (endY - peakY!) * 0.5;
          // console.log('Firework coordinates:', {
          //   startX,
          //   startY,
          //   peakX,
          //   peakY,
          // });
          if (num1 === 0) {
            animateMotion.setAttribute(
              'path',
              `M${startX0!},${startY0!} Q${startX0! + (peakX! - startX0!) * 0.5},${
                startY0! + (peakY! - startY0!) * 0.5
              } ${peakX!},${peakY!}`,
            );
            console.log(
              'path for 0 particle',
              `M${startX0!},${startY0!} Q${startX0! + (peakX! - startX0!) * 0.5},${
                startY0! + (peakY! - startY0!) * 0.5
              } ${peakX!},${peakY!}`,
            );
            animateMotion.setAttribute('dur', '1s');
            animateMotion.setAttribute('begin', `0s`);
            animateMotion.setAttribute('repeatCount', 'indefinite');
          } else {
            animateMotion.setAttribute(
              'path',
              `M${peakX},${peakY} Q${controlX},${controlY} ${endX},${endY}`,
            );
            animateMotion.setAttribute('dur', '2s');
            animateMotion.setAttribute(
              'begin',
              `${3 + (num1 / particleCount) * 0.002}s`,
            );

            animateMotion.setAttribute('repeatCount', 'indefinite');
          }
          // animateMotion.setAttribute('additive', 'sum');

          animateOpacity.setAttribute('attributeName', 'opacity');
          animateOpacity.setAttribute('from', '1');
          animateOpacity.setAttribute('to', '0');

          animateOpacity.setAttribute('dur', '1s');
          animateOpacity.setAttribute('begin', `${3}s`);
          animateOpacity.setAttribute('repeatCount', '1');
          particle.appendChild(animateOpacity);
        }
        if (animationOption1 === 1) {
          animateTransform.setAttribute('attributeName', 'transform');
          animateTransform.setAttribute('type', 'scale');
          animateTransform.setAttribute('from', '0');
          animateTransform.setAttribute('to', `${size / 6}`);
          animateTransform.setAttribute('dur', `${10 / particleSpeed}s`);
          animateTransform.setAttribute('repeatCount', 'indefinite');
        } else if (animationOption1 === 2) {
          animateTransform.setAttribute('attributeName', 'transform');
          animateTransform.setAttribute('type', 'scale');
          animateTransform.setAttribute('from', `${size / 6}`);
          animateTransform.setAttribute('to', '0');
          animateTransform.setAttribute('dur', `${10 / particleSpeed}s`);
          animateTransform.setAttribute('repeatCount', 'indefinite');
        }

        animateColor.setAttribute('attributeName', 'fill');
        animateColor.setAttribute('dur', `${10 / particleSpeed}s`);
        animateColor.setAttribute('repeatCount', 'indefinite');
        animateColor.setAttribute(
          'values',
          'hsl(0, 100%, 50%); hsl(60, 100%, 50%); hsl(120, 100%, 50%); hsl(180, 100%, 50%); hsl(240, 100%, 50%); hsl(300, 100%, 50%); hsl(360, 100%, 50%)',
        );

        particle.appendChild(animateMotion);
        particle.appendChild(animateTransform);

        particle.appendChild(animateColor);

        // Calculate individual particle speed
        if (animationOption1 !== 5) {
          animateMotion.setAttribute('dur', `${10 / particleSpeed}s`);
          animateMotion.setAttribute('repeatCount', 'indefinite');
        }
        return particle;
      };

      const nextAnimate = (n: number) => {
        const timerInterval1 = setInterval(function () {
          if (animationOption !== 5) return;
          clearInterval(timerInterval1);
          while (svg.firstChild) {
            svg.removeChild(svg.firstChild);
          }

          const particle1 = document.createElementNS(svgNS, 'path');
          const shape =
            particleTypes1[Math.floor(Math.random() * particleTypes1.length)];

          particle1.setAttribute('d', svgPath(shape));
          particle1.setAttribute('fill', `hsl(32, 100%, 50%)`);

          const startX = windowSize.width! * (0.2 + Math.random() * 0.6);
          const startY = windowSize.height! * 0.9;

          // Random peak position in upper part of canvas
          const peakX = startX; // Allow some horizontal drift
          const peakY = windowSize.height! * (0.2 + Math.random() * 0.3); // Peak between 20-50% of height
          for (let i = 0; i < particleCount1; i++) {
            svg.appendChild(createParticle(i, peakX, peakY, startX, startY));
          }
          nextAnimate(n - 1);
        }, 5000);
      };

      const init = () => {
        if (animationOption1 !== 5) {
          while (svg.firstChild) {
            svg.removeChild(svg.firstChild);
          }

          for (let i = 0; i < particleCount1; i++) {
            svg.appendChild(createParticle(i, null, null, null, null));
          }
        } else {
          while (svg.firstChild) {
            svg.removeChild(svg.firstChild);
          }
          console.log('Firework');

          nextAnimate(5);
        }
      };

      init();
    }
  }, [
    particleCount1,
    maxSize1,
    animationOption1,
    animationSpeed1,
    speedVariation1,
    originX1,
    originY1,
    rainAngle1,
    particleTypes1,
    windowSize.width,
    windowSize.height,
    animationOption,
    particleCount,
  ]);
  return (
    <div
      className={`flex justify-center items-center w-screen h-screen absolute top-0 z-2000 left-0 ${
        !vis ? 'hidden' : ''
      }`}
      style={gradientStyle}
    >
      <div
        className="relative w-full h-full"
        style={{
          backgroundImage: `url(${showBackdrop ? '/images/backdrop.png' : ''})`,
          backgroundPosition: 'center',
          backgroundSize: 'cover',
        }}
      >
        <div className="w-full h-full flex justify-start items-center">
          {mode === 'Video' && (
            <VideoPlayingComponent
              videoUri={videoUri.link}
              text1={videoUri.name}
              titleBarHider={titleBarHider}
              showBackdrop={showBackdrop}
              seconds={seconds}
              unmuteVideos={unmuteVideos}
            />
          )}
          {mode === 'Event Results' && events && events.length > 0 && (
            <DisplayCompResults
              name={events.filter((event) => event.id === eventID)[0].name!} 
              scores={events.filter((event) => event.id === eventID)[0].scores}
              teams={events.filter((event) => event.id === eventID)[0].teams}
              dances={events.filter((event) => event.id === eventID)[0].dances}
              judges={events.filter((event) => event.id === eventID)[0].judges}
              selectedDanceId={selectedDanceId}
              judgingFormat={events.filter((event) => event.id === eventID)[0].judgingFormat || 'Original'}
              releasedDances={events.filter((event) => event.id === eventID)[0].releasedDances || {}}
              finalized={events.filter((event) => event.id === eventID)[0].finalized || {}}
            />
          )}
          {mode === 'Auto' && (
            <AutoImages
              picsArray={displayedPicturesAuto.map((pic) => pic.link)}
              seconds={seconds}
              videoBG={videoUri.link}
              text1={manualPicture.name}
              fontSizeTime={fontSizeTime}
              showBackdrop={showBackdrop}
              compLogo={compLogo.link}
              titleBarHider={titleBarHider}
              onRenewInterval={() => {
                setRefreshVar(!refreshVar);
                onRenewInterval();
              }}
            />
          )}
          {mode === 'Auto Full' &&
            picArrAutoMode.length > 0 &&
            videoArrAutoMode.length > 0 && (
              <FullAutoMode
                picsArray={picArrAutoMode}
                vidsArray={videoArrAutoMode}
                seconds={seconds}
                videoBG={videoUri.link}
                text1={manualPicture.name}
                fontSizeTime={fontSizeTime}
                showBackdrop={showBackdrop}
                message={message}
                compLogo={compLogo.link}
                titleBarHider={titleBarHider}
                onRenewInterval={() => {
                  setRefreshVar(!refreshVar);
                  onRenewInterval();
                }}
              />
            )}
          {mode === 'Auto Table' && message && (
            <AutoTableMode
              message={message}
              tablePages={tablePages}
              showBackdrop={showBackdrop}
              fontSize={fontSize}
              compLogo={compLogo.link}
              fontName={fontName}
              textColor={textColor}
            />
          )}
          {mode === 'Manual' && (
            <ManualImage
              image1={manualPicture.link}
              text1={manualPicture.name}
              compLogo={compLogo.link}
              showBackdrop={showBackdrop}
              titleBarHider={titleBarHider}
              videoBG={videoUri.link}
              fontSizeTime={fontSizeTime}
            />
          )}
          {mode === 'Default' && (
            <div
              className={`absolute left-0 right-0 m-auto   transition-opacity `}
              style={{
                top: `${fontSizeTime * 1.8}px`,
                bottom: `${fontSizeTime * 0.8}px`,
              }}
            >
              {!showTable && (
                <div
                  className="h-full w-auto my-auto z-10 bg-center bg-no-repeat bg-contain"
                  style={{
                    backgroundImage: `url(${compLogo.link})`,
                    boxShadow: '0 30px 40px rgba(0,0,0,.1)',
                  }}
                ></div>
              )}
            </div>
          )}
          {showTable && (
            <TablePage
              tablePages={tablePages}
              tableChoice={tableChoice}
              fontSize={fontSize}
              fontSize2={fontSize2}
              picture1={compLogo.link}
              picture2={manualPicture.link}
              fontName={fontName}
              colorBG={colorBG}
              textColor={textColor}
            />
          )}
          {showSVGAnimation1 && (
            <div className="absolute inset-0 flex justify-center items-center">
              {windowSize.width! > 0 && windowSize.height! > 0 && (
                <svg
                  ref={svgRef}
                  style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'transparent',
                  }}
                />
              )}
            </div>
          )}
          {showUrgentMessage && (
            <div
              className="absolute inset-0 flex flex-col justify-center items-center cursor-pointer "
              onClick={(e) => handleSubmit(e, button1)}
              style={{
                color: textColor,
                textShadow: '5px 5px #C9AB78',
              }}
            >
              {/* <p className="font-bold m-0"
              style={{fontSize: `${fontSize}px`}}
              >{message}</p> */}
              {message > '' && (
                <AnimatedTextMessage
                  text={message}
                  duration={5}
                  delay={0}
                  height={fontSize * 2 + 'px'}
                  name={fontName}
                  width={'90%'}
                  stroke={1}
                  color={textColor}
                  cutdelay={false}
                  rotate={true}
                />
              )}

              {message2 > '' && (
                <AnimatedTextMessage
                  text={message2}
                  duration={5}
                  delay={3}
                  height={fontSize2 * 2 + 'px'}
                  name={'Lato'}
                  width={'98%'}
                  stroke={1}
                  color={textColor}
                  cutdelay={false}
                  rotate={false}
                />
              )}

              {/* <p className="font-bold m-0"
               style={{fontSize: `${fontSize2}px`}}
              >{message2}</p> */}
            </div>
          )}
          {/* <div
            onClick={(e) => handleSubmit(e, button1)}
            className="absolute top-0 left-1 cursor-pointer"
            style={{ color: textColor }}
          >
            <p
              className="font-bold text-3xl m-0"
              style={{ textShadow: '5px 5px #C9AB78' }}
            >
              {heatNum}
            </p>
          </div> */}
          <div className="absolute inset-0 flex flex-col justify-center items-center m-2">
            <div
              onClick={(e) => handleSubmit(e, button1)}
              className=" w-full flex justify-center items-center cursor-pointer relative"
              style={{
                color: textColor,
                fontSize: `${fontSizeTime}px`,
                height: `${fontSizeTime + 2}px`,
              }}
            >
              <span className="font-bold m-0 leading-none">
                {showHeatNumber ? heat : ''}
              </span>
              <span className="font-bold m-0 leading-none absolute right-0 top-0">
                {timeNow}
              </span>
            </div>
            {frameStyle === 'Fire frame' && (
              <FrameOnFire
                className={'w-[90%] h-full flex justify-center items-center'}
              />
            )}
            {frameStyle === 'Glow frame' && (
              <FrameGlow
                className={'w-[99%] h-full flex justify-center items-center'}
              />
            )}
            {frameStyle === 'Running frame' && (
              <FrameRunnerEffect
                className={'w-full h-full flex justify-center items-center'}
              />
            )}
            {frameStyle === 'No frame' && (
              <div
                className={'w-[90%] h-full flex justify-center items-center'}
              ></div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default ShowPlayingModal;
