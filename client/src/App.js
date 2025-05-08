import React, { useState } from "react";
import styled from "styled-components";
import SignupForm from "./components/SignupForm";
import Header from "./components/Header";

const AppContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

const Content = styled.main`
  flex: 1;
  padding: 2rem 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleSignupSuccess = () => {
    setIsAuthenticated(true);
  };

  return (
    <AppContainer>
      <Header />
      <Content>
        {!isAuthenticated ? (
          <SignupForm onSignupSuccess={handleSignupSuccess} />
        ) : (
          <SuccessMessage>
            <h2>Success! 🎉</h2>
            <p>Check your phone to start chatting with Mate AI.</p>
          </SuccessMessage>
        )}
      </Content>
    </AppContainer>
  );
};

const SuccessMessage = styled.div`
  text-align: center;
  padding: 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  max-width: 500px;
  width: 100%;

  h2 {
    margin-bottom: 1rem;
    color: #28a745;
  }

  p {
    font-size: 1.1rem;
    line-height: 1.5;
  }
`;

export default App;
