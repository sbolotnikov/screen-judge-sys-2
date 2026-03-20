'use client';
import { FC, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';
import { PageWrapper } from '@/components/page-wrapper';
import ShowIcon from '@/components/svg/showIcon';
import { useDimensions } from '@/hooks/useDimensions';


const Page: FC = ({}) => {
  const router = useRouter();
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const passwordConfirmRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [scrolling, setScrolling] = useState(true);
  const windowSize = useDimensions();
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (passwordRef.current?.value !== passwordConfirmRef.current?.value) {
      return setError('Passwords do not match');
    }
    let pass = '';
    if (passwordRef.current?.value) pass = passwordRef.current?.value;
    if (pass.length < 6) {
      return setError('Passwords should be at least 6 symbols long');
    }
    try {
      setError('');
      setLoading(true);
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: emailRef.current?.value,
          password: passwordRef.current?.value,
        }),
      });
      //Await for data for any desirable next steps
      const data = await res.json();
      setError(data.message);
    } catch (error) {
      if (error) {
        setError('Fail to create user');
      }
    }

    setLoading(false);
  };
  useEffect(() => {
    const frameId = requestAnimationFrame(() => {
      const wrapperHeight = document.querySelector('#wrapperDiv')?.clientHeight ?? 0;
      const containedHeight = document.querySelector('#containedDiv')?.clientHeight ?? 0;
      setScrolling(wrapperHeight - containedHeight > 0);
    });

    return () => cancelAnimationFrame(frameId);
  }, [windowSize.height]);
  return (
    <PageWrapper className="absolute inset-0  w-full h-screen flex items-center justify-center ">
      <div className="blurFilter border-0 rounded-md p-1 mt-4 shadow-2xl w-[90%] max-h-[560px]  max-w-[450px] md:w-full bg-lightMainBG/70 dark:bg-darkMainBG/70 h-[70svh] md:h-[85svh] relative overflow-y-auto">
        <div id="wrapperDiv" className="w-full h-full border rounded-md border-lightMainColor dark:border-darkMainColor relative overflow-y-auto flex flex-col justify-center items-center">
          <div id="containedDiv"
            className={`${scrolling?"":"absolute top-0 left-0"} flex flex-col items-center justify-between  w-full `}
          > 
            <h2
            className="text-center font-semibold md:text-4xl uppercase"
            style={{ letterSpacing: '1px' }}
          >
             Register New User
          </h2>
            <div className=" h-20 w-20 md:h-28 md:w-28 mb-6 fill-lightMainColor  stroke-lightMainColor dark:fill-darkMainColor dark:stroke-darkMainColor m-auto">
              <ShowIcon icon={'Register'} stroke={'0.1'} />
            </div>
            <form
              className="flex flex-col items-center   p-1 bottom-0"
              onSubmit={handleSubmit}
            >
              {error && (
                <label className="text-center text-red-600 italic font-bold">
                  {error}
                </label>
              )}
              <label className="flex flex-col items-center">
                Email
                <input
                  className="flex-1 outline-none border-none rounded-md   text-lightMainColor p-0.5 mx-1"
                  id="email"
                  type="email"
                  ref={emailRef}
                  required
                />
              </label>
              <label className="flex flex-col items-center">
                Password
                <input
                  className="flex-1 outline-none border-none rounded-md   text-lightMainColor p-0.5 mx-1"
                  id="password"
                  type="password"
                  ref={passwordRef}
                  defaultValue={''}
                  required
                />
              </label>
              <label className="flex flex-col items-center    ">
                Password Confirmation
                <input
                  className="flex-1 outline-none border-none rounded-md  p-0.5 mx-1 mb-2"
                  id="password-confirm"
                  type="password"
                  defaultValue={''}
                  ref={passwordConfirmRef}
                  required
                />
              </label>
              <button
                className="btnBlue1 p-2 max-w-xs"
                disabled={loading}
                type="submit"
              >
                Submit
              </button>
            </form>
            <label className="flex flex-col items-center    border-t-2">
            Already have an account?
              <button
                type="button"
                className={`cursor-pointer h-12 w-12 mb-1 md:h-10 md:w-10 hover:animate-bounce hover:scale-110 `}
                onClick={() => router.push ('/login')}
              > 
                <div className="group flex  cursor-pointer  hover:scale-110  flex-col items-center ">
                <div className="  h-12 w-12 fill-none rounded-full   p-1 group-hover:animate-bounce stroke-lightMainColor dark:stroke-darkMainColor ">
                  <ShowIcon icon={'Login'} stroke={'1'} />
                </div>
                <p className=" tracking-widest mx-3 rounded-md text-lightMainColor darkMainColor    md:dark:text-darkMainColor dark:text-darkMainColor  opacity-100 group-hover:inline-flex md:block  md:group-hover:opacity-100 ">
                  {'LogIn'}
                </p>
              </div>
              </button>
            </label>
            
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default Page;
