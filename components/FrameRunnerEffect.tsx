import React from 'react'

type Props = {
    className: string;
}
const FrameRunnerEffect: React.FC<Props> = ({className}) => {
    let colors=["#183657","#A7C9E7","#C8F1F6","#183657","#A7C9E7","#C8F1F6" ]
    // '#fd0909','#faf601', '#faf601','#fd0909','#faf601','#faf601',
    let gradient=`conic-gradient(
              from var(--gradient-angle),
              ${colors.join(',')}
            ) 1`
    return ( 
      <div 
        className={`${className} frameRunner`}
        style={{
          borderImage: gradient,
        }}
      >
        <style>{`
          .frameRunner::before {
            border-image: ${gradient}
          }
        `}</style>
        <style>{`
          .frameRunner::after {
            border-image: ${gradient}
          }
        `}</style>
      </div>   
    )
}

export default FrameRunnerEffect