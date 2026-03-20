'use client';
import { FC } from 'react';
import { PageWrapper } from '@/components/page-wrapper';
import ShowIcon from '@/components/svg/showIcon';
import PartyAccessManager from '@/components/PartyAccessManager';
import UserRoleManager from '@/components/UserRoleManager';

const Page: FC = ({}) => {
  return (
    <PageWrapper className="absolute top-0 left-0 w-full h-screen flex items-center justify-center">
      <div
        className="blurFilter border-0 rounded-md p-2 shadow-2xl w-[95%] h-[90%] max-w-[1200px] bg-lightMainBG/70 dark:bg-darkMainBG/70 md:mb-3"
        // style={{ boxShadow: '0 0 150px rgb(113, 113, 109 / 50%),inset 0 0 20px #242422' }}
      >
        <div className="border rounded-md border-lightMainColor dark:border-darkMainColor overflow-hidden w-full h-full p-2 flex flex-col relative">
          <div className="flex flex-col w-full h-full">
            <div className="flex flex-col justify-center items-center w-full mb-6">
              <h2
                className="text-center font-semibold text-2xl md:text-4xl uppercase"
                style={{ letterSpacing: '1px' }}
              >
                Admin Dashboard
              </h2>
              <div className="h-16 w-16 m-auto hidden md:block">
                <ShowIcon icon={'Dashboard'} stroke={'0.1'} />
              </div>
            </div>

            {/* Party Access Management Section */}
            <div className="flex-1 overflow-y-auto">
              <PartyAccessManager />
              <UserRoleManager />
            </div>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
};

export default Page;
