import React, { useId, memo } from 'react';

interface Props {
  isOpen: boolean;
  toggle: () => void;
}

const MenuToggleComponent: React.FC<Props> = ({ isOpen, toggle }) => {
  const checkboxId = useId();
  
  return (
    <div className="menu-toggle-component">
        <input 
            type="checkbox" 
            id={checkboxId} 
            checked={isOpen} 
            onChange={toggle} 
            className="menu-toggle__checkbox"
            aria-label="Toggle menu"
        />
        <label htmlFor={checkboxId} className="toggle">
            <div className="bars bar1"></div>
            <div className="bars bar2"></div>
            <div className="bars bar3"></div>
        </label>
        <style>{`
            .menu-toggle__checkbox {
                position: absolute;
                width: 1px;
                height: 1px;
                padding: 0;
                margin: -1px;
                overflow: hidden;
                clip: rect(0, 0, 0, 0);
                white-space: nowrap;
                border-width: 0;
            }

            .menu-toggle__checkbox:focus-visible + .toggle {
                outline: 2px solid rgb(176, 92, 255);
                outline-offset: 6px;
                border-radius: 4px;
            }

            .toggle {
                position: relative;
                width: 28px;
                height: 28px;
                cursor: pointer;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 5px;
                transition-duration: .5s;
            }

            .bars {
                width: 100%;
                height: 3px;
                background-color: rgb(176, 92, 255);
                border-radius: 4px;
            }

            /* Desktop Size */
            @media (min-width: 768px) {
                .toggle {
                    width: 36px;
                    height: 36px;
                    gap: 7px;
                }
                .bars {
                    height: 4px;
                }
            }

            .bar2 {
                transition-duration: .8s;
            }

            .bar1, .bar3 {
                width: 70%;
            }

            /* Animation States */
            input[id="${checkboxId}"]:checked + .toggle .bars {
                position: absolute;
                transition-duration: .5s;
            }

            input[id="${checkboxId}"]:checked + .toggle .bar2 {
                transform: scaleX(0);
                transition-duration: .5s;
            }

            input[id="${checkboxId}"]:checked + .toggle .bar1 {
                width: 100%;
                transform: rotate(45deg);
                transition-duration: .5s;
            }

            input[id="${checkboxId}"]:checked + .toggle .bar3 {
                width: 100%;
                transform: rotate(-45deg);
                transition-duration: .5s;
            }

            input[id="${checkboxId}"]:checked + .toggle {
                transition-duration: .5s;
                transform: rotate(180deg);
            }
        `}</style>
    </div>
  );
};

const MenuToggle = memo(MenuToggleComponent);
export default MenuToggle;