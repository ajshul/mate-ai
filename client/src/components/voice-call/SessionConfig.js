import React, { useState, useEffect } from "react";
import styled from "styled-components";

const ConfigContainer = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const ConfigHeader = styled.div`
  padding: 1rem;
  border-bottom: 1px solid #f3f4f6;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ConfigTitle = styled.h3`
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
`;

const ConfigStatus = styled.div`
  display: flex;
  align-items: center;
  font-size: 0.75rem;
  color: ${(props) => (props.$saved ? "#16a34a" : "#6b7280")};
`;

const StatusIcon = styled.span`
  margin-right: 0.25rem;
`;

const ConfigContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
`;

const Textarea = styled.textarea`
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 0.5rem;
  font-size: 0.875rem;
  line-height: 1.5;
  min-height: 100px;
  resize: vertical;
  width: 100%;

  &:focus {
    outline: none;
    border-color: #6e8efb;
    box-shadow: 0 0 0 2px rgba(110, 142, 251, 0.2);
  }
`;

const Select = styled.select`
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 0.5rem;
  font-size: 0.875rem;
  width: 100%;

  &:focus {
    outline: none;
    border-color: #6e8efb;
    box-shadow: 0 0 0 2px rgba(110, 142, 251, 0.2);
  }
`;

const SaveButton = styled.button`
  background-color: ${(props) => (props.disabled ? "#f3f4f6" : "#6e8efb")};
  color: ${(props) => (props.disabled ? "#9ca3af" : "white")};
  border: none;
  border-radius: 6px;
  padding: 0.75rem 1rem;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
  transition: background-color 0.2s;
  margin-top: 1rem;

  &:hover:not(:disabled) {
    background-color: #5a7df9;
  }
`;

const SessionConfig = ({ onSave, callActive }) => {
  const [instructions, setInstructions] = useState(
    "You are a helpful AI assistant on a phone call. Answer the caller's questions clearly and concisely."
  );
  const [voice, setVoice] = useState("alloy");
  const [hasChanges, setHasChanges] = useState(false);
  const [saveStatus, setSaveStatus] = useState("idle"); // idle, saving, saved, error

  // Track changes to determine if there are unsaved modifications
  useEffect(() => {
    setHasChanges(true);
  }, [instructions, voice]);

  // Reset save status after 3 seconds when saved
  useEffect(() => {
    if (saveStatus === "saved" || saveStatus === "error") {
      const timer = setTimeout(() => {
        setSaveStatus("idle");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [saveStatus]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaveStatus("saving");

    try {
      await onSave({
        instructions,
        voice,
      });

      setSaveStatus("saved");
      setHasChanges(false);
    } catch (error) {
      console.error("Failed to save configuration:", error);
      setSaveStatus("error");
    }
  };

  // Get status display text based on current status
  const getStatusText = () => {
    switch (saveStatus) {
      case "saving":
        return "Saving...";
      case "saved":
        return "Saved";
      case "error":
        return "Error saving";
      default:
        return hasChanges ? "Unsaved changes" : "No changes";
    }
  };

  return (
    <ConfigContainer>
      <ConfigHeader>
        <ConfigTitle>Session Configuration</ConfigTitle>
        <ConfigStatus $saved={saveStatus === "saved"}>
          <StatusIcon>
            {saveStatus === "saved" && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            )}
            {saveStatus === "error" && (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            )}
          </StatusIcon>
          {getStatusText()}
        </ConfigStatus>
      </ConfigHeader>
      <ConfigContent>
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label htmlFor="instructions">Instructions</Label>
            <Textarea
              id="instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Enter instructions for the AI assistant"
            />
          </FormGroup>

          <FormGroup>
            <Label htmlFor="voice">Voice</Label>
            <Select
              id="voice"
              value={voice}
              onChange={(e) => setVoice(e.target.value)}
            >
              <option value="alloy">Alloy</option>
              <option value="echo">Echo</option>
              <option value="fable">Fable</option>
              <option value="onyx">Onyx</option>
              <option value="nova">Nova</option>
              <option value="shimmer">Shimmer</option>
            </Select>
          </FormGroup>

          <SaveButton
            type="submit"
            disabled={!hasChanges || saveStatus === "saving" || callActive}
          >
            {saveStatus === "saving" ? "Saving..." : "Save Configuration"}
          </SaveButton>
        </Form>
      </ConfigContent>
    </ConfigContainer>
  );
};

export default SessionConfig;
