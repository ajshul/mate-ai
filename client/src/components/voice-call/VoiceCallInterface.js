import React, { useState, useEffect } from "react";
import styled from "styled-components";
import PhoneNumberChecklist from "./PhoneNumberChecklist";
import SetupChecklist from "./SetupChecklist";
import Transcript from "./Transcript";
import FunctionCallsPanel from "./FunctionCallsPanel";
import SessionConfig from "./SessionConfig";
import handleRealtimeEvent from "./handleRealtimeEvent";

const InterfaceContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 1.5rem;
  gap: 1.5rem;
`;

const MainContent = styled.div`
  display: grid;
  grid-template-columns: 1fr 2fr 1fr;
  gap: 1.5rem;
  flex: 1;
  min-height: 0;
`;

const Column = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
`;

const VoiceCallInterface = () => {
  const [selectedPhoneNumber, setSelectedPhoneNumber] = useState("");
  const [configReady, setConfigReady] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [items, setItems] = useState([]);
  const [ws, setWs] = useState(null);
  const [callStatus, setCallStatus] = useState("disconnected"); // disconnected, connected, active

  // Establish WebSocket connection when config is ready
  useEffect(() => {
    if (configReady && !ws) {
      try {
        // Get the VOICE_CALL_PUBLIC_URL from environment or fetch it from the server
        fetch("/api/voice-call-url")
          .then((response) => response.json())
          .then((data) => {
            const voiceCallUrl =
              data.url || "https://2ba9-128-148-206-1.ngrok-free.app";
            const wsUrl = voiceCallUrl.replace("https://", "wss://") + "/logs";

            console.log("Connecting to voice WebSocket:", wsUrl);
            const newWs = new WebSocket(wsUrl);

            newWs.onopen = () => {
              console.log("Connected to voice call WebSocket");
              setCallStatus("connected");
            };

            newWs.onmessage = (event) => {
              try {
                const data = JSON.parse(event.data);
                console.log("Received voice call event:", data);
                handleRealtimeEvent(data, setItems);

                // Set call status to active if we're receiving audio events
                if (data.type === "input_audio_buffer.speech_started") {
                  setCallStatus("active");
                }
              } catch (error) {
                console.error("Error processing WebSocket message:", error);
              }
            };

            newWs.onclose = () => {
              console.log("Voice call WebSocket disconnected");
              setWs(null);
              setCallStatus("disconnected");
            };

            newWs.onerror = (error) => {
              console.error("Voice call WebSocket error:", error);
            };

            setWs(newWs);
          })
          .catch((error) => {
            console.error("Error fetching voice call URL:", error);
          });
      } catch (error) {
        console.error("Failed to establish WebSocket connection:", error);
      }
    }

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [configReady, ws]);

  const handleOpenSetup = () => {
    setShowSetupModal(true);
  };

  const handleCloseSetup = () => {
    setShowSetupModal(false);
  };

  const handleCompleteSetup = () => {
    setConfigReady(true);
    setShowSetupModal(false);
  };

  const handleSaveConfig = async (config) => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      return new Promise((resolve, reject) => {
        try {
          const updateEvent = {
            type: "session.update",
            session: {
              ...config,
            },
          };

          console.log("Sending config update:", updateEvent);
          ws.send(JSON.stringify(updateEvent));
          resolve();
        } catch (error) {
          console.error("Error sending config update:", error);
          reject(error);
        }
      });
    } else {
      return Promise.reject(new Error("WebSocket not connected"));
    }
  };

  return (
    <>
      <InterfaceContainer>
        <PhoneNumberChecklist
          selectedPhoneNumber={selectedPhoneNumber}
          configReady={configReady}
          onOpenConfig={handleOpenSetup}
        />

        <MainContent>
          <Column>
            <SessionConfig
              onSave={handleSaveConfig}
              callActive={callStatus === "active"}
            />
          </Column>

          <Column>
            <Transcript items={items} />
          </Column>

          <Column>
            <FunctionCallsPanel items={items} ws={ws} />
          </Column>
        </MainContent>
      </InterfaceContainer>

      <SetupChecklist
        open={showSetupModal}
        onClose={handleCloseSetup}
        onComplete={handleCompleteSetup}
        selectedPhoneNumber={selectedPhoneNumber}
        setSelectedPhoneNumber={setSelectedPhoneNumber}
      />
    </>
  );
};

export default VoiceCallInterface;
