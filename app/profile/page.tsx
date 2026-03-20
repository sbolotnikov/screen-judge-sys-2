'use client';
import React, { FC } from 'react';
import { useRef, useEffect, useState } from 'react';
import { signOut } from 'next-auth/react';
import { useSession } from 'next-auth/react';
import AlertMenu from '../../components/alertMenu';
import ShowIcon from '@/components/svg/showIcon';  
import ImgFromDb from '@/components/ImgFromDb';
import { PageWrapper } from '@/components/page-wrapper';
import { useRouter } from 'next/navigation';

const Page: FC = ({}) => {
  const { data: session, status } = useSession();
  const router = useRouter();

  const sessionUser = session?.user as
    | {
        id?: string | null;
        name?: string | null | undefined;
        email?: string | null | undefined;
        image?: string | null | undefined;
        role?: string | null;
        telephone?: string | null;
      }
    | undefined;
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const userNameRef = useRef<HTMLInputElement>(null);
  const telephoneRef = useRef<HTMLInputElement>(null);

  const passwordConfirmRef = useRef<HTMLInputElement>(null);
  const [revealAlert, setRevealAlert] = useState(false);
  const [alertStyle, setAlertStyle] = useState({
    variantHead: '',
    heading: '',
    text: ``,
    color1: '',
    button1: '',
    color2: '',
    button2: '',
    inputField: '',
  });
  const [loading, setLoading] = useState(false); 

  const [userURL, setUserURL] = useState<string | null>(
    sessionUser?.image ?? null
  );
  const [phone, setPhone] = useState(sessionUser?.telephone ?? '');

  const onReturn = (decision1: string, fileLink: string | null) => {
    setRevealAlert(false);
    if (decision1 == 'Close') {
    }
    if (decision1 == 'Re-enter') {
      setLoading(true);
      signOut();
      setLoading(false);
    }
    if (decision1 == 'Upload') {
      console.log('file link', fileLink);
      setUserURL(fileLink);
    }
  };
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [router, status]);

  const scrollIntoView = (ref: React.RefObject<HTMLInputElement | null>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  
  const handleSubmit = (event: React.SyntheticEvent) => {
    event.preventDefault();
    const target1 = event.target as typeof event.target & {
      user_name: { value: string };
      user_email: { value: string };
      password: { value: string };
      passwordConfirm: { value: string };
      telephone: { value: string };
    };
    const name = target1.user_name.value; // typechecks!
    const email = target1.user_email.value;
    const password = target1.password.value;
    const passwordConfirm = target1.passwordConfirm.value;
    const telephone = target1.telephone.value;

    let validationError = '';
    document.querySelector('#user_name')!.classList.remove('invalid_input');
    document.querySelector('#user_email')!.classList.remove('invalid_input');
    document.querySelector('#password')!.classList.remove('invalid_input');
    document
      .querySelector('#passwordConfirm')!
      .classList.remove('invalid_input');
    document.querySelector('#telephone')!.classList.remove('invalid_input');
    // submitting profile updated information
    if (name.length < 3) {
      validationError = 'User Name is too short';
      // make name input red
      document.querySelector('#user_name')!.classList.add('invalid_input');
    } else if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
      validationError = 'Enter a valid email';
      // make email input red
      document.querySelector('#user_email')!.classList.add('invalid_input');
    } else if (password.length < 6 && password.length > 0) {
      validationError = 'Password is too short. 6 or more symbols';
      // make message input red
      document.querySelector('#password')!.classList.add('invalid_input');
    } else if (password !== passwordConfirm) {
      validationError = 'Password did not match';
      // make message input red
      document.querySelector('#password')!.classList.add('invalid_input');
      document.querySelector('#passwordConfirm')!.classList.add('invad_input');
    } else if (
      !/\(?([0-9]{3})\)?([ .-]?)([0-9]{3})\2([0-9]{4})/.test(telephone)
    ) {
      validationError = 'Enter a valid phone number for example (123) 456 7899';
      // make email input red
      document.querySelector('#telephone')!.classList.add('invalid_input');
    }
    if (validationError > '') {
      setAlertStyle({
        variantHead: 'danger',
        heading: 'Warning',
        text: validationError,
        color1: 'warning',
        button1: 'Close',
        color2: '',
        button2: '',
        inputField: '',
      });
      setRevealAlert(true);
      return;
    }

    setLoading(true);
    console.log(passwordRef.current?.value);
    fetch('/api/profile_update', {
      method: 'POST',
      headers: {
        Accept: 'application/json, text/plain, */*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: userNameRef.current?.value,
        id: sessionUser?.id,
        image: userURL,
        phone,
        password: passwordRef.current?.value,
      }),
    }).then(async (res) => {
      
      setLoading(false);
      setAlertStyle({
        variantHead: 'info',
        heading: 'Message',
        text: 'You successfully updated your Profile. Please login to continue.',
        color1: 'secondary',
        button1: 'Re-enter',
        color2: '',
        button2: '',
        inputField: '',
      });

      setRevealAlert(true);
      console.log(res);
    });
  };
  return (
    <PageWrapper className="absolute top-0 left-0 w-full h-screen flex items-center md:items-end justify-center">
      <AlertMenu
        visibility={revealAlert}
        onReturn={onReturn}
        styling={alertStyle}
      />
     

      <div className="blurFilter shadow-2xl w-[90%]  max-w-[450px] md:w-full h-[85svh]  bg-lightMainBG/70 dark:bg-darkMainBG/70 border-0 rounded-md  p-2 md:mb-3">
        <div
          id="wrapperDiv"
          className="w-full h-full border rounded-md border-lightMainColor dark:border-darkMainColor relative overflow-y-auto flex flex-col justify-center items-center"
        >
          <div
            id="containedDiv"
            className={`absolute top-0 left-0 flex flex-col w-full p-1 justify-center items-center mb-32`}
          >
            <h2
              className="text-center w-[80%] font-semibold md:text-4xl uppercase relative"
              style={{ letterSpacing: '1px' }}
            >
              Your&rsquo;s {sessionUser?.role ?? ''} Profile
              <button
                type="button"
                className="absolute top-1 -right-5 md:-right-[2.2rem] md:top-1.5  h-6 w-6   md:h-8 md:w-8 rounded-sm outline-none "
                onClick={() => {
                  signOut();
                }}
              >
                <div className="group flex  cursor-pointer  hover:scale-110  flex-col items-center ">
                  <div className=" h-6 w-6 md:h-8 md:w-8 fill-none group-hover:animate-bounce stroke-lightMainColor dark:stroke-darkMainColor ">
                    <ShowIcon icon={'Logout'} stroke={'2'} />
                  </div>
                  <p className=" tracking-widest mx-3  group-hover:inline-flex text-sm ">
                    {'Logout'}
                  </p>
                </div>
              </button>
            </h2>
            <div className="relative flex justify-center items-center outline-none   w-full my-14 mx-auto">
              {userURL !== null && userURL !== undefined ? (
                <div className=" h-48 w-48 md:h-52 md:w-52 fill-lightMainColor m-auto flex justify-center items-center stroke-lightMainColor dark:fill-darkMainColor dark:stroke-darkMainColor ">
                  <ImgFromDb
                    url={userURL}
                    stylings="object-contain overflow-hidden rounded-md"
                    alt="User Picture"
                  />
                </div>
              ) : (
                <div className=" h-48 w-48 md:h-52 md:w-52 fill-lightMainColor  stroke-lightMainColor dark:fill-darkMainColor dark:stroke-darkMainColor overflow-hidden rounded-md ">
                  <ShowIcon icon={'DefaultUser'} stroke={'2'} />
                </div>
              )}

              <button
                className=" outline-none border-none fill-lightMainColor  stroke-lightMainColor dark:fill-darkMainColor dark:stroke-darkMainColor rounded-md  absolute p-1 -top-1 right-16 md:right-24 w-8 h-8"
                onClick={(e) => {
                  e.preventDefault();
                  setAlertStyle({
                    variantHead: 'danger',
                    heading: 'Warning',
                    text: 'You are about to Upload New Avatar Image',
                    color1: 'info',
                    button1: 'Upload',
                    color2: 'secondary',
                    button2: 'Cancel',
                    inputField: 'true',
                  });
                  setRevealAlert(!revealAlert);
                  return;
                }}
              >
                <ShowIcon icon={'Exchange'} stroke={'0.5'} />
              </button>
            </div>

            <form onSubmit={handleSubmit} autoComplete="off">
              <label className="flex flex-col items-center p-1 rounded-t-md bottom-0">
                Your Name:
                <input
                  name="user_name"
                  id="user_name"
                  className="flex-1 outline-none bg-menuBGColor text-darkMainColor dark:text-menuBGColor dark:bg-darkMainColor border-none rounded-md p-0.5 mx-1 my-1"
                  type="text"
                  placeholder="Enter Name"
                  defaultValue={sessionUser?.name ?? ''}
                  ref={userNameRef}
                  autoComplete="off"
                />
              </label>

              <label className="flex flex-col items-center p-1  rounded-t-md bottom-0">
                Email Address
                <input
                  name="user_email"
                  id="user_email"
                  className="flex-1 outline-none bg-menuBGColor text-darkMainColor dark:text-menuBGColor dark:bg-darkMainColor border-none rounded-md -bg p-0.5 mx-1 my-1"
                  type="email"
                  ref={emailRef}
                  defaultValue={sessionUser?.email ?? ''}
                  onFocus={() => scrollIntoView(emailRef)}
                  autoComplete="off"
                  required
                />
              </label>
              <label className="flex flex-col items-center p-1  rounded-t-md bottom-0">
                Password
                <input
                  className="flex-1 outline-none bg-menuBGColor text-darkMainColor dark:text-menuBGColor dark:bg-darkMainColor border-none rounded-md  p-0.5 mx-1 my-1"
                  name="password"
                  id="password"
                  type="password"
                  ref={passwordRef}
                  onFocus={() => scrollIntoView(passwordRef)}
                  placeholder="leave blank if not needed to change"
                  autoComplete="new-password"
                />
              </label>
              <label className="flex flex-col items-center p-1  rounded-t-md bottom-0">
                Confirm Password
                <input
                  className="flex-1 outline-none bg-menuBGColor text-darkMainColor dark:text-menuBGColor dark:bg-darkMainColor border-none rounded-md  p-0.5 mx-1 my-1"
                  name="passwordConfirm"
                  id="passwordConfirm"
                  type="password"
                  ref={passwordConfirmRef}
                  onFocus={() => scrollIntoView(passwordConfirmRef)}
                  placeholder="leave blank if not needed to change"
                  autoComplete="new-password"
                />
              </label>
              <label className="flex flex-col items-center p-1  rounded-t-md bottom-0">
                Telephone
                <input
                  className="flex-1 outline-none bg-menuBGColor text-darkMainColor dark:text-menuBGColor dark:bg-darkMainColor border-none rounded-md  p-0.5 mx-1 my-1"
                  name="telephone"
                  id="telephone"
                  ref={telephoneRef}
                  type="tel"
                  placeholder="1234567890"
                  onFocus={() => scrollIntoView(telephoneRef)}
                  onChange={(e) => {
                    setPhone(e.target.value);
                  }}
                  value={phone}
                  autoComplete="off"
                />
              </label>

              <button
                disabled={loading}
                className="btnFancy w-[90%]"
                type="submit"
              >
                Update
              </button>
            </form>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};
export default Page;
