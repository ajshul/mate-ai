import React, { useState, useEffect } from "react";
import styled from "styled-components";

const DialogOverlay = styled.div`
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
`;

const DialogContent = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 800px;
  padding: 1.5rem;
  max-height: 90vh;
  overflow-y: auto;
`;

const DialogHeader = styled.div`
  margin-bottom: 1.5rem;
`;

const DialogTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
`;

const DialogDescription = styled.p`
  color: #6b7280;
  font-size: 0.875rem;
`;

const ChecklistItem = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f3f4f6;

  &:last-child {
    border-bottom: none;
  }
`;

const ItemInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const ItemHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
`;

const ItemIcon = styled.div`
  color: ${(props) => (props.$done ? "#22c55e" : "#9ca3af")};
`;

const ItemTitle = styled.span`
  font-weight: 500;
`;

const ItemDescription = styled.p`
  color: #6b7280;
  font-size: 0.75rem;
  margin-left: 1.5rem;
`;

const ItemAction = styled.div`
  display: flex;
  align-items: center;
`;

const Button = styled.button`
  background-color: ${(props) => (props.$primary ? "#6e8efb" : "white")};
  color: ${(props) => (props.$primary ? "white" : "#374151")};
  border: 1px solid ${(props) => (props.$primary ? "#6e8efb" : "#e5e7eb")};
  border-radius: 6px;
  padding: 0.5rem 1rem;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: ${(props) => (props.$primary ? "#5a7df9" : "#f9fafb")};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const Input = styled.input`
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 0.5rem;
  font-size: 0.875rem;
  width: 100%;

  &:disabled {
    background-color: #f9fafb;
    cursor: not-allowed;
  }
`;

const InputGroup = styled.div`
  display: flex;
  gap: 0.5rem;
  width: 100%;
`;

const DialogFooter = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 1.5rem;
`;

const LoadingSpinner = () => (
  <svg
    className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);

const SetupChecklist = ({
  open,
  onClose,
  onComplete,
  selectedPhoneNumber,
  setSelectedPhoneNumber,
}) => {
  const [hasCredentials, setHasCredentials] = useState(false);
  const [phoneNumbers, setPhoneNumbers] = useState([]);
  const [currentNumberSid, setCurrentNumberSid] = useState("");
  const [currentVoiceUrl, setCurrentVoiceUrl] = useState("");

  const [publicUrl, setPublicUrl] = useState("");
  const [localServerUp, setLocalServerUp] = useState(false);
  const [publicUrlAccessible, setPublicUrlAccessible] = useState(false);

  const [allChecksPassed, setAllChecksPassed] = useState(false);
  const [webhookLoading, setWebhookLoading] = useState(false);
  const [ngrokLoading, setNgrokLoading] = useState(false);

  const appendedTwimlUrl = publicUrl ? `${publicUrl}/twiml` : "";
  const isWebhookMismatch =
    appendedTwimlUrl && currentVoiceUrl && appendedTwimlUrl !== currentVoiceUrl;

  // Poll for changes to configuration
  useEffect(() => {
    if (!open) return;

    const pollChecks = async () => {
      try {
        // Check if credentials are set
        const credentialsRes = await fetch("/api/voice-call/twilio");
        if (credentialsRes.ok) {
          const credData = await credentialsRes.json();
          setHasCredentials(!!credData?.credentialsSet);
        }

        // Check for phone numbers
        const numbersRes = await fetch("/api/voice-call/twilio/numbers");
        if (numbersRes.ok) {
          const numbersData = await numbersRes.json();
          if (Array.isArray(numbersData) && numbersData.length > 0) {
            setPhoneNumbers(numbersData);

            // Select a phone number if none is selected
            const selected =
              numbersData.find((p) => p.sid === currentNumberSid) ||
              numbersData[0];
            setCurrentNumberSid(selected.sid);
            setCurrentVoiceUrl(selected.voiceUrl || "");
            setSelectedPhoneNumber(selected.friendlyName || "");
          }
        }

        // Check server and public URL
        try {
          const serverRes = await fetch("/api/voice-call/server-status");
          if (serverRes.ok) {
            const serverData = await serverRes.json();
            setLocalServerUp(!!serverData?.serverUp);
            setPublicUrl(serverData?.publicUrl || "");
          }
        } catch (error) {
          setLocalServerUp(false);
          setPublicUrl("");
        }
      } catch (error) {
        console.error("Error polling setup status:", error);
      }
    };

    pollChecks();
    const intervalId = setInterval(pollChecks, 3000);

    return () => {
      clearInterval(intervalId);
    };
  }, [open, currentNumberSid, setSelectedPhoneNumber]);

  // Update allChecksPassed when any relevant state changes
  useEffect(() => {
    const checks = [
      hasCredentials,
      phoneNumbers.length > 0,
      localServerUp,
      publicUrlAccessible,
      !!publicUrl && !isWebhookMismatch,
    ];

    setAllChecksPassed(checks.every(Boolean));
  }, [
    hasCredentials,
    phoneNumbers,
    localServerUp,
    publicUrlAccessible,
    publicUrl,
    isWebhookMismatch,
  ]);

  const updateWebhook = async () => {
    if (!currentNumberSid || !appendedTwimlUrl) return;

    try {
      setWebhookLoading(true);
      const res = await fetch("/api/voice-call/twilio/numbers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumberSid: currentNumberSid,
          voiceUrl: appendedTwimlUrl,
        }),
      });

      if (res.ok) {
        setCurrentVoiceUrl(appendedTwimlUrl);
      }
    } catch (error) {
      console.error("Failed to update webhook:", error);
    } finally {
      setWebhookLoading(false);
    }
  };

  const checkNgrok = async () => {
    if (!localServerUp || !publicUrl) return;

    setNgrokLoading(true);
    try {
      const res = await fetch("/api/voice-call/check-ngrok", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicUrl }),
      });

      if (res.ok) {
        const data = await res.json();
        setPublicUrlAccessible(data.accessible);
      }
    } catch (error) {
      console.error("Failed to check ngrok:", error);
    } finally {
      setNgrokLoading(false);
    }
  };

  const checklist = [
    {
      label: "Set up Twilio account",
      done: hasCredentials,
      description: "Then update account details in .env file",
      field: (
        <Button
          onClick={() => window.open("https://console.twilio.com/", "_blank")}
        >
          Open Twilio Console
        </Button>
      ),
    },
    {
      label: "Set up Twilio phone number",
      done: phoneNumbers.length > 0,
      description: "Purchase a phone number with voice capabilities",
      field:
        phoneNumbers.length > 0 ? (
          phoneNumbers.length === 1 ? (
            <Input value={phoneNumbers[0].friendlyName || ""} disabled />
          ) : (
            <select
              value={currentNumberSid}
              onChange={(e) => {
                setCurrentNumberSid(e.target.value);
                const selected = phoneNumbers.find(
                  (p) => p.sid === e.target.value
                );
                if (selected) {
                  setSelectedPhoneNumber(selected.friendlyName || "");
                  setCurrentVoiceUrl(selected.voiceUrl || "");
                }
              }}
            >
              {phoneNumbers.map((phone) => (
                <option key={phone.sid} value={phone.sid}>
                  {phone.friendlyName}
                </option>
              ))}
            </select>
          )
        ) : (
          <Button
            onClick={() =>
              window.open(
                "https://console.twilio.com/us1/develop/phone-numbers/manage/incoming",
                "_blank"
              )
            }
          >
            Set up Twilio phone number
          </Button>
        ),
    },
    {
      label: "Start voice call server",
      done: localServerUp,
      description: "Run 'cd src/voice-call-server && npm run dev'",
      field: null,
    },
    {
      label: "Configure ngrok",
      done: publicUrlAccessible,
      description: "Run ngrok and add URL to VOICE_CALL_PUBLIC_URL in .env",
      field: (
        <InputGroup>
          <Input value={publicUrl} disabled />
          <Button
            onClick={checkNgrok}
            disabled={ngrokLoading || !localServerUp || !publicUrl}
          >
            {ngrokLoading ? <LoadingSpinner /> : null}
            Check
          </Button>
        </InputGroup>
      ),
    },
    {
      label: "Update Twilio webhook URL",
      done: !!publicUrl && !isWebhookMismatch,
      description: "Connect Twilio number to your ngrok URL",
      field: (
        <InputGroup>
          <Input value={currentVoiceUrl} disabled />
          <Button
            onClick={updateWebhook}
            disabled={webhookLoading || !publicUrl}
          >
            {webhookLoading ? <LoadingSpinner /> : null}
            Update
          </Button>
        </InputGroup>
      ),
    },
  ];

  if (!open) return null;

  return (
    <DialogOverlay>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Voice Call Setup</DialogTitle>
          <DialogDescription>
            Complete these steps to enable AI voice calls in your application
          </DialogDescription>
        </DialogHeader>

        <div>
          {checklist.map((item, index) => (
            <ChecklistItem key={index}>
              <ItemInfo>
                <ItemHeader>
                  <ItemIcon $done={item.done}>
                    {item.done ? (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                      </svg>
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="10"></circle>
                      </svg>
                    )}
                  </ItemIcon>
                  <ItemTitle>{item.label}</ItemTitle>
                </ItemHeader>
                {item.description && (
                  <ItemDescription>{item.description}</ItemDescription>
                )}
              </ItemInfo>
              <ItemAction>{item.field}</ItemAction>
            </ChecklistItem>
          ))}
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Cancel</Button>
          <Button
            $primary
            onClick={() => onComplete()}
            disabled={!allChecksPassed}
            style={{ marginLeft: "0.5rem" }}
          >
            Complete Setup
          </Button>
        </DialogFooter>
      </DialogContent>
    </DialogOverlay>
  );
};

export default SetupChecklist;
