
 
import { ImageResponse } from 'next/og';

// Route segment config
export const runtime = 'edge';

// Image metadata
export const size = {
  width: 144,
  height: 144,
};
export const contentType = 'image/png';

// Image generation
export default function Icon() {
  return new ImageResponse(
    (
    //   ImageResponse JSX element
    <div
    style={{ 
      background: 'transparent',
      width: '144px',
      height: '144px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
       
    }}
  >
      <img width={144} height={144} alt={'Logo'} src={ 'https://screen-judge-sys-2.vercel.app/icon-144x144.png'}  />
  </div>
  
    ),
    // ImageResponse options
    {
      // For convenience, we can re-use the exported icons size metadata
      // config to also set the ImageResponse's width and height.
      ...size,
    }
  );
}