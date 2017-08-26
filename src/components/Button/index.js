import React, {Component} from 'react';
import styled from 'styled-components';

class Button extends Component {
    render() {
        const {
            children, onClick = () => {
            }
        } = this.props;

        return (
            <StyledButton onClick={onClick}>
                {children}
            </StyledButton>
        )
    }
}
const StyledButton = styled.button`
  background-color:red;
`;
export default Button;
