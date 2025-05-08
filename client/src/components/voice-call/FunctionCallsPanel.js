import React, { useState } from "react";
import styled from "styled-components";
import { ItemTypes, StatusTypes } from "./types";

const PanelContainer = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const PanelHeader = styled.div`
  padding: 1rem;
  border-bottom: 1px solid #f3f4f6;
`;

const PanelTitle = styled.h3`
  font-size: 0.875rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
`;

const PanelContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 2rem;
  text-align: center;
`;

const EmptyIcon = styled.div`
  width: 100px;
  height: 100px;
  background-color: #f3f4f6;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;

  svg {
    width: 40px;
    height: 40px;
    color: #d1d5db;
  }
`;

const EmptyText = styled.p`
  color: #6b7280;
  font-size: 0.875rem;
`;

const FunctionCard = styled.div`
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const FunctionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const FunctionName = styled.span`
  font-weight: 500;
  font-size: 0.875rem;
  color: #111827;
`;

const FunctionBadge = styled.span`
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  background-color: ${(props) => (props.$completed ? "#dcfce7" : "#f3f4f6")};
  color: ${(props) => (props.$completed ? "#16a34a" : "#6b7280")};
`;

const FunctionParams = styled.pre`
  background-color: #f9fafb;
  border-radius: 6px;
  padding: 0.5rem;
  font-family: monospace;
  font-size: 0.75rem;
  color: #4b5563;
  white-space: pre-wrap;
  word-break: break-word;
  margin-bottom: 1rem;
  overflow-x: auto;
`;

const ResponseInput = styled.input`
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 0.875rem;
  margin-bottom: 0.5rem;

  &:focus {
    outline: none;
    border-color: #6e8efb;
    box-shadow: 0 0 0 2px rgba(110, 142, 251, 0.2);
  }
`;

const SubmitButton = styled.button`
  width: 100%;
  background-color: ${(props) => (props.disabled ? "#f3f4f6" : "#6e8efb")};
  color: ${(props) => (props.disabled ? "#9ca3af" : "white")};
  border: none;
  border-radius: 6px;
  padding: 0.5rem;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
  transition: background-color 0.2s;

  &:hover:not(:disabled) {
    background-color: #5a7df9;
  }
`;

const ResponseDisplay = styled.div`
  background-color: #f9fafb;
  border-radius: 6px;
  padding: 0.5rem;
  font-size: 0.75rem;
  color: #4b5563;
  white-space: pre-wrap;
  word-break: break-word;
`;

const FunctionCallsPanel = ({ items, ws }) => {
  const [responses, setResponses] = useState({});

  // Filter function_call items
  const functionCalls = items.filter(
    (item) => item.type === ItemTypes.FUNCTION_CALL
  );

  // For each function_call, check for a corresponding function_call_output
  const functionCallsWithStatus = functionCalls.map((call) => {
    const outputs = items.filter(
      (item) =>
        item.type === ItemTypes.FUNCTION_CALL_OUTPUT &&
        item.call_id === call.call_id
    );
    const outputItem = outputs[0];
    const completed = call.status === StatusTypes.COMPLETED || !!outputItem;
    const response = outputItem ? outputItem.output : undefined;

    return {
      ...call,
      completed,
      response,
    };
  });

  const handleChange = (call_id, value) => {
    setResponses((prev) => ({ ...prev, [call_id]: value }));
  };

  const handleSubmit = (call) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    const call_id = call.call_id || "";
    ws.send(
      JSON.stringify({
        type: "conversation.item.create",
        item: {
          type: ItemTypes.FUNCTION_CALL_OUTPUT,
          call_id: call_id,
          output: JSON.stringify(responses[call_id] || ""),
        },
      })
    );

    // Ask the model to continue after providing the tool response
    ws.send(JSON.stringify({ type: "response.create" }));
  };

  return (
    <PanelContainer>
      <PanelHeader>
        <PanelTitle>Function Calls</PanelTitle>
      </PanelHeader>
      <PanelContent>
        {functionCallsWithStatus.length === 0 ? (
          <EmptyState>
            <EmptyIcon>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
              </svg>
            </EmptyIcon>
            <EmptyText>No function calls yet</EmptyText>
          </EmptyState>
        ) : (
          functionCallsWithStatus.map((call, index) => (
            <FunctionCard key={index}>
              <FunctionHeader>
                <FunctionName>{call.name}</FunctionName>
                <FunctionBadge $completed={call.completed}>
                  {call.completed ? "Completed" : "Pending"}
                </FunctionBadge>
              </FunctionHeader>

              <FunctionParams>
                {JSON.stringify(call.params, null, 2)}
              </FunctionParams>

              {!call.completed ? (
                <>
                  <ResponseInput
                    placeholder="Enter response"
                    value={responses[call.call_id || ""] || ""}
                    onChange={(e) =>
                      handleChange(call.call_id || "", e.target.value)
                    }
                  />
                  <SubmitButton
                    onClick={() => handleSubmit(call)}
                    disabled={!responses[call.call_id || ""]}
                  >
                    Submit Response
                  </SubmitButton>
                </>
              ) : (
                <ResponseDisplay>
                  {call.response
                    ? JSON.stringify(JSON.parse(call.response), null, 2)
                    : "No response data"}
                </ResponseDisplay>
              )}
            </FunctionCard>
          ))
        )}
      </PanelContent>
    </PanelContainer>
  );
};

export default FunctionCallsPanel;
