
import React, { forwardRef, memo } from 'react';

interface AnimatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  containerClassName?: string;
}

const AnimatedInputComponent = forwardRef<HTMLInputElement, AnimatedInputProps>(({ className, containerClassName, style, ...props }, ref) => {
  return (
    <div className={`animated-input-wrapper ${containerClassName || ''}`}>
      <input
        ref={ref}
        className={`animated-input ${className || ''}`}
        style={style}
        {...props}
      />
      <style>{`
        .animated-input-wrapper {
            position: relative;
            width: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
        }
        .animated-input {
            width: 100%;
            height: 2.5em;
            border-radius: 2.5em;
            border: none;
            background-color: rgb(255, 255, 255);
            box-shadow: 1px 1px 10px rgba(0,0,0,0.1);
            font-family: inherit;
            color: rgb(77, 77, 77);
            text-align: center;
            font-size: 14px;
            font-weight: 600;
            outline: 2px solid rgba(0, 0, 0, 0);
            transition: outline-offset 0.5s ease, outline-color 0.5s ease,
                height 0.5s ease, transform 0.5s ease, box-shadow 0.5s ease;
            padding: 0 1.5em;
        }
        .animated-input:focus {
            outline-offset: 4px;
            outline-color: rgba(0, 0, 0, 0.15);
            height: 3em;
            transform: scale(1.02);
            box-shadow: 2px 4px 15px rgba(0,0,0,0.15);
            z-index: 10;
        }
        
        :global(.dark) .animated-input:focus {
            outline-color: rgba(255, 255, 255, 0.3);
        }

        .animated-input::placeholder {
            transition: transform 0.5s ease, opacity 0.3s ease;
            opacity: 0.6;
            font-weight: 500;
            letter-spacing: 0.5px;
        }
        .animated-input:focus::placeholder {
            transform: translateX(-50px);
            opacity: 0;
        }
      `}</style>
    </div>
  );
});

AnimatedInputComponent.displayName = 'AnimatedInput';

const AnimatedInput = memo(AnimatedInputComponent);
export default AnimatedInput;
