"use client"

import classNames from "classnames";
import {motion} from "framer-motion";

export const PageWrapper = ({
    children, className
}:{
    children: React.ReactNode;
    className?:string
}) =>(
    <motion.div 
    initial={{ opacity: 0, x: -600 }}
    transition={{
      ease: 'easeOut',
      duration: 1,
      times: [0, 0.2, 0.5, 0.8, 1],
    }}
    animate={{
      opacity: [0, 1, 1, 1, 1],
      rotateX: ['90deg', '89deg', '89deg', '0deg', '0deg'],
      x: ['-100vw', '0vw', '0vw', '0vw', '0vw'],
    }}
    exit={{
      opacity: [1, 1, 1, 1, 0],
      rotateX: ['0deg', '0deg', '89deg', '89deg', '90deg'],
      x: ['0vw', '0vw', '0vw', '0vw', '-100vw'],
    }} 
    className={classNames("",className)}>
        {children}
    </motion.div>
 
)