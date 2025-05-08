import React from "react";
import styled from "styled-components";

const HeaderContainer = styled.header`
  background-color: #ffffff;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  padding: 1rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Logo = styled.div`
  font-size: 1.8rem;
  font-weight: 700;
  color: #333;
  display: flex;
  align-items: center;

  span {
    margin-left: 0.5rem;
  }
`;

const LogoIcon = styled.div`
  background: linear-gradient(135deg, #6e8efb, #a777e3);
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 800;
  font-size: 20px;
`;

const Nav = styled.nav`
  display: flex;
  gap: 1.5rem;
`;

const NavLink = styled.a`
  color: #555;
  font-weight: 500;
  transition: color 0.2s;

  &:hover {
    color: #6e8efb;
  }
`;

const Header = () => {
  return (
    <HeaderContainer>
      <Logo>
        <LogoIcon>M</LogoIcon>
        <span>Mate AI</span>
      </Logo>
      <Nav>
        <NavLink href="https://github.com/ajshul/mate-ai" target="_blank">
          GitHub
        </NavLink>
      </Nav>
    </HeaderContainer>
  );
};

export default Header;
