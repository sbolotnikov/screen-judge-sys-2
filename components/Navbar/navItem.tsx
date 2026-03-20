import Link from 'next/link';
import ShowIcon from '../svg/showIcon';
import Ribbon from '../svg/ribbon';

type IProps = {
  icon: string;
  title: string;
  url: string;
};
function NavItem({ icon, title, url }: IProps) {
  return (
    <Link href={url}  className='relative' aria-label={title}>
      <Ribbon />
      <div className="group flex  absolute inset-0 cursor-pointer justify-start ml-11 flex-row items-center md:group-hover:scale-125 md:ml-0 md:justify-center  md:w-12 md:flex-col md:items-center ">
     
        <div className="nav_img  ml-2 h-8 w-8 rounded-full bg-lightMainBG dark:bg-lightMainColor p-1 my-1.5 mr-2 fill-none group-hover:animate-bounce  md:order-none md:mb-1 stroke-darkMainColor md:stroke-lightMainColor md:dark:stroke-darkMainColor ">
          <ShowIcon icon={icon} stroke={'1.5'} />
        </div>
        
        <p className=" tracking-widest    flex-wrap  rounded-md    group-hover:inline-flex text-darkMainColor md:bg-lightMainBG md:dark:bg-lightMainColor md:dark:text-darkMainColor md:text-lightMainColor md:group-hover:block z-10 md:hidden ">
          {title}
        </p>
      </div>
    </Link>
  );
}

export default NavItem;
