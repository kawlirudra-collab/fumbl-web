import React from 'react';
import styled from 'styled-components';

const Switch = ({ onToggle }) => {
  return (
    <StyledWrapper>
      <div className="container">
        <input 
            type="checkbox" 
            name="checkbox" 
            id="checkbox" 
            onChange={(e) => {
                if (e.target.checked) {
                    setTimeout(() => onToggle(), 600); 
                }
            }}
        />
        <label htmlFor="checkbox" className="label"> </label>
      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;

  .container {
  }

  .label {
    height: 60px;
    width: 120px;
    background-color: #D9281E; /* Fumbl Red Background */
    border-radius: 30px;
    
    -webkit-box-shadow: inset 0 0 5px 4px rgba(255, 255, 255, 0.5),
      inset 0 0 20px 1px rgba(0, 0, 0, 0.488), 10px 20px 30px rgba(0, 0, 0, 0.096),
      inset 0 0 0 3px rgba(0, 0, 0, 0.3);
    box-shadow: inset 0 0 5px 4px rgba(255, 255, 255, 0.5),
      inset 0 0 20px 1px rgba(0, 0, 0, 0.488), 10px 20px 30px rgba(0, 0, 0, 0.096),
      inset 0 0 0 3px rgba(0, 0, 0, 0.3);
      
    display: -webkit-box;
    display: -ms-flexbox;
    display: flex;
    -webkit-box-align: center;
    -ms-flex-align: center;
    align-items: center;
    cursor: pointer;
    position: relative;
    -webkit-transition: -webkit-transform 0.4s;
    transition: -webkit-transform 0.4s;
    transition: transform 0.4s;
  }

  .label:hover {
    -webkit-transform: perspective(100px) rotateX(5deg) rotateY(-5deg);
    transform: perspective(100px) rotateX(5deg) rotateY(-5deg);
  }

  #checkbox:checked ~ .label:hover {
    -webkit-transform: perspective(100px) rotateX(-5deg) rotateY(5deg);
    transform: perspective(100px) rotateX(-5deg) rotateY(5deg);
  }

  #checkbox {
    display: none;
  }

  /* --- ON STATE (Clicked) --- */
  #checkbox:checked ~ .label::before {
    left: 70px;
    
    /* Matches the Page Background (Black) */
    background-color: #050505; 
    background-image: none; /* Removed gradient */
    
    -webkit-transition: 0.4s;
    transition: 0.4s;
  }

  /* --- OFF STATE (Default) --- */
  .label::before {
    position: absolute;
    content: "";
    height: 40px;
    width: 40px;
    border-radius: 50%;
    
    /* Matches the Fumbl Cream */
    background-color: #f6f3e6; 
    background-image: none; /* Removed gradient */
    
    left: 10px;
    -webkit-box-shadow: 0 2px 1px rgba(0, 0, 0, 0.3),
      10px 10px 10px rgba(0, 0, 0, 0.3);
    box-shadow: 0 2px 1px rgba(0, 0, 0, 0.3), 10px 10px 10px rgba(0, 0, 0, 0.3);
    -webkit-transition: 0.4s;
    transition: 0.4s;
  }
`;

export default Switch;