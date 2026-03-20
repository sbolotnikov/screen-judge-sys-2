import { useEffect } from "react";


function Burger({status}) {
    useEffect(() =>{
     status?document.getElementById("middlebar").classList.add('translate-x-14'):document.getElementById("middlebar").classList.remove('translate-x-14');
     status?document.getElementById("topbar").classList.add('rotate-45'):document.getElementById("topbar").classList.remove('rotate-45'); 
     status?document.getElementById("bottombar").classList.add('-rotate-45'):document.getElementById("bottombar").classList.remove('-rotate-45');
     status?document.getElementById("topbar").classList.add('translate-x-1.5'):document.getElementById("topbar").classList.remove('translate-x-1.5');
     status?document.getElementById("bottombar").classList.add('translate-x-1.5'):document.getElementById("bottombar").classList.remove('translate-x-1.5');
    //  status?document.getElementById("containerSVG").classList.add('w-1'):document.getElementById("containerSVG").classList.remove('w-1');
  }, [status])
    
  return (
    <div id="containerSVG" className="relative h-5 w-5 transition duration-300 ease-in-out rounded-lg ">
                  <svg id="topbar"
            className="h-5 w-5 absolute top-0 left-0 transition duration-300 ease-in-out origin-top-left"
            viewBox="0 0 70 70"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g >
              <path              
                d="M5 13H65.5"
                stroke="currentColor"
                strokeWidth="8"
                strokeLinecap="round"
              />
            </g>
          </svg>
          <svg id="middlebar"
            className="h-5 w-5  absolute top-0 left-0 transition duration-300 ease-in-out"
            viewBox="0 0 70 70"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g>

              <path
                
                d="M5 35H65.5"
                stroke="currentColor"
                strokeDasharray="61"
                strokeDashoffset="0"
                strokeWidth="8"
                strokeLinecap="round"
              />

            </g>
          </svg>
          <svg  id="bottombar"
            className="h-5 w-5 absolute top-0 left-0 transition duration-300 ease-in-out origin-bottom-left"
            viewBox="0 0 70 70"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g>

              <path
               
                d="M5 57H65.5"
                stroke="currentColor"
                strokeWidth="8"
                strokeLinecap="round"
              />
            </g>
          </svg>
    </div>
  )
}

export default Burger