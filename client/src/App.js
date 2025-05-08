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

const Tab = styled.button`
  padding: 1rem 2rem;
  font-size: 1rem;
  font-weight: 500;
  border: none;
  background: none;
  cursor: pointer;
  color: ${(props) => (props.$active ? "#6e8efb" : "#6b7280")};
  border-bottom: 2px solid
    ${(props) => (props.$active ? "#6e8efb" : "transparent")};
  transition: all 0.2s;
  flex: 1;

  &:hover {
    color: ${(props) => (props.$active ? "#6e8efb" : "#111827")};
    background-color: ${(props) => (props.$active ? "transparent" : "#f9fafb")};
  }
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
              <Tab
                $active={activeTab === "text"}
                onClick={() => setActiveTab("text")}
              >
                Text Messaging
              </Tab>
              <Tab
                $active={activeTab === "voice"}
                onClick={() => setActiveTab("voice")}
              >
                Voice Calls
              </Tab>
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
