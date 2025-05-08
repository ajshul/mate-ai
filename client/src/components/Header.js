import React from "react";
import styled from "styled-components";

const HeaderContainer = styled.header`
  background-color: #ffffff;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  padding: 1rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 100;
`;

const Logo = styled.div`
  font-size: 1.8rem;
  font-weight: 700;
  color: #333;
  display: flex;
  align-items: center;

  span {
    margin-left: 0.5rem;
    background: linear-gradient(135deg, #6e8efb, #a777e3);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
`;

const LogoIcon = styled.div`
  background: linear-gradient(135deg, #6e8efb, #a777e3);
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 800;
  font-size: 22px;
  box-shadow: 0 2px 8px rgba(110, 142, 251, 0.3);
`;

const Nav = styled.nav`
  display: flex;
  gap: 1.5rem;
`;

const NavLink = styled.a`
  color: #555;
  font-weight: 500;
  transition: all 0.2s;
  padding: 0.5rem 1rem;
  border-radius: 6px;

  &:hover {
    color: #6e8efb;
    background-color: #f5f7ff;
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
