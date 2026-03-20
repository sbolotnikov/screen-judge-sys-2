import React from 'react';

type Props = {
  className: string;
};

const FrameOnFire = ({ className }: Props) => {
  return (
    <div className={className}>
      <div className={`${className} frameAnimate `}>
      </div>
      <svg className="w-0 h-0">
        <filter id="wavy" >
          <feTurbulence
            x="0"
            y="0"
            baseFrequency="0.02"
            numOctaves="5"
            seed="2"
          >
            <animate
              attributeName="baseFrequency"
              dur="60s"
              values="0.02;0.05;0.02"
              repeatCount="indefinite"
            />
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" scale="30" />
        </filter>
      </svg>
    </div>
  );
};

export default FrameOnFire;
