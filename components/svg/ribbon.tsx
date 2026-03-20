import React from 'react';

type Props = {};

const Ribbon = (props: Props) => {
  return (
      <svg
        className="object-fill  w-full h-full fill-franceBlue dark:stroke-darkMainColor stroke-lightMainColor md:hidden" 
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 2072 512"
        strokeWidth={'10.8311'}
      >
        <path d="M12 134.074H461.179V505.839H97.5584L191.672 354.612L12 134.074Z" />
        <path d="M2060 134.074H1584.35V505.839H1974.44L1880.33 354.612L2060 134.074Z" />
        <path d="M268.024 6H1822.16V444.525H259.844L268.024 6Z" />
        <path d="M259.844 448.138L459.362 506L461.53 446.574L259.844 448.138Z" />
        <path d="M1822.16 448.138L1586.91 506L1584.35 446.574L1822.16 448.138Z" />
      </svg>
  );
};

export default Ribbon;
