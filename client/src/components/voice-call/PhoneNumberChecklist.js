import React, { useState } from "react";
import styled from "styled-components";

const ChecklistContainer = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const NumberSection = styled.div`
  display: flex;
  flex-direction: column;
`;

const Label = styled.span`
  font-size: 0.75rem;
  color: #666;
  margin-bottom: 0.25rem;
`;

const NumberDisplay = styled.div`
  display: flex;
  align-items: center;
`;

const Number = styled.span`
  font-weight: 500;
  width: 140px;
`;

const EyeIcon = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;

  &:hover {
    color: #333;
  }
`;

const StatusSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const StatusIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const StatusIcon = styled.div`
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: ${(props) => (props.$ready ? "#22c55e" : "#d1d5db")};
`;

const StatusText = styled.span`
  font-size: 0.875rem;
  color: #4b5563;
`;

const ConfigButton = styled.button`
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: #f9fafb;
  }
`;

const PhoneNumberChecklist = ({
  selectedPhoneNumber,
  configReady,
  onOpenConfig,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  return (
    <ChecklistContainer>
      <NumberSection>
        <Label>Phone Number</Label>
        <NumberDisplay>
          <Number>
            {isVisible ? selectedPhoneNumber || "None" : "••••••••••"}
          </Number>
          <EyeIcon onClick={() => setIsVisible(!isVisible)}>
            {isVisible ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
                <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
                <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
                <line x1="2" x2="22" y1="2" y2="22" />
              </svg>
            )}
          </EyeIcon>
        </NumberDisplay>
      </NumberSection>
      <StatusSection>
        <StatusIndicator>
          <StatusIcon $ready={configReady} />
          <StatusText>
            {configReady ? "Setup Ready" : "Setup Not Ready"}
          </StatusText>
        </StatusIndicator>
        <ConfigButton onClick={onOpenConfig}>Checklist</ConfigButton>
      </StatusSection>
    </ChecklistContainer>
  );
};

export default PhoneNumberChecklist;
