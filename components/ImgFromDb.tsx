import {FC, useEffect, useState} from 'react'
import Image from 'next/image'

interface ImgFromDbProps {
  url: string,
  stylings: string,
  alt: string
}

const ImgFromDb: FC<ImgFromDbProps> = ({url,stylings, alt}) => {
    const[displayURL, setDisplayURL] =useState<string | null>(null)
    
    const isHttp = url?.includes("http");
    const finalUrl = isHttp ? url : displayURL;

    useEffect(() => {
        if (!isHttp && url) {
          fetch('/api/img_get',{
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id:url })
          })
          .then((response) => response.json())
          .then((data) => {
              setDisplayURL(data.message)
          })
        }
    }, [url, isHttp]);

    return finalUrl ? <Image src={finalUrl} className={stylings} width={500} height={500} unoptimized alt={alt} /> : null;
}
export default ImgFromDb