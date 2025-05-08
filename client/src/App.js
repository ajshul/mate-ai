import React, { useState } from "react";
import styled from "styled-components";
import SignupForm from "./components/SignupForm";
import Header from "./components/Header";
import VoiceCallInterface from "./components/voice-call/VoiceCallInterface";
import TextMessagingInterface from "./components/TextMessagingInterface";

const AppContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f9fafb;
`;

const Content = styled.main`
  flex: 1;
  padding: 2rem 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const TabsContainer = styled.div`
  display: flex;
  margin-bottom: 2rem;
  border-bottom: 1px solid #e5e7eb;
  width: 100%;
  max-width: 800px;
  justify-content: center;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
  overflow: hidden;
`;

const TabButton = styled.button`
  padding: 1rem 1.5rem;
  border: none;
  background: none;
  font-size: 1rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
  color: ${(props) =>
    props.$active ? "var(--primary)" : "var(--text-secondary)"};
  border-bottom: 2px solid
    ${(props) => (props.$active ? "var(--primary)" : "transparent")};
  transition: all 0.2s;

  &:hover {
    color: var(--primary);
    background-color: var(--primary-light);
  }
`;

const TabLabel = styled.span`
  font-weight: 600;
`;

const InterfaceContainer = styled.div`
  width: 100%;
  max-width: ${(props) => (props.$isVoice ? "1200px" : "800px")};
  display: flex;
  justify-content: center;
`;

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState("text");

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
          <>
            <TabsContainer>
              <TabButton
                $active={activeTab === "text"}
                onClick={() => setActiveTab("text")}
              >
                <TabLabel $active={activeTab === "text"}>
                  Text Messaging
                </TabLabel>
              </TabButton>
              <TabButton
                $active={activeTab === "voice"}
                onClick={() => setActiveTab("voice")}
              >
                <TabLabel $active={activeTab === "voice"}>Voice Calls</TabLabel>
              </TabButton>
            </TabsContainer>

            <InterfaceContainer $isVoice={activeTab === "voice"}>
              {activeTab === "text" ? (
                <TextMessagingInterface />
              ) : (
                <VoiceCallInterface />
              )}
            </InterfaceContainer>
          </>
        )}
      </Content>
    </AppContainer>
  );
};

export default App;
