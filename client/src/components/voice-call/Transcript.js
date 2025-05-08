import React, { useEffect, useRef } from "react";
import styled from "styled-components";
import { ItemTypes, RoleTypes } from "./types";

const TranscriptContainer = styled.div`
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const TranscriptContent = styled.div`
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
  width: 140px;
  height: 140px;
  background-color: #f3f4f6;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;

  svg {
    width: 64px;
    height: 64px;
    color: #d1d5db;
  }
`;

const EmptyTitle = styled.p`
  font-weight: 500;
  color: #6b7280;
  margin-bottom: 0.5rem;
`;

const EmptyDescription = styled.p`
  color: #9ca3af;
  font-size: 0.875rem;
`;

const MessageContainer = styled.div`
  display: flex;
  margin-bottom: 1.5rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const MessageAvatar = styled.div`
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background-color: ${(props) => {
    if (props.$role === RoleTypes.USER) return "#f9fafb";
    if (props.$role === RoleTypes.TOOL) return "#f3f4f6";
    return "#6e8efb";
  }};
  border: 1px solid
    ${(props) => {
      if (props.$role === RoleTypes.USER) return "#e5e7eb";
      if (props.$role === RoleTypes.TOOL) return "#e5e7eb";
      return "#5a7df9";
    }};
  color: ${(props) => {
    if (props.$role === RoleTypes.USER) return "#6b7280";
    if (props.$role === RoleTypes.TOOL) return "#6b7280";
    return "#ffffff";
  }};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 0.75rem;
  flex-shrink: 0;
`;

const MessageContent = styled.div`
  flex: 1;
`;

const MessageHeader = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 0.375rem;
`;

const MessageSender = styled.span`
  font-weight: 500;
  font-size: 0.875rem;
  margin-right: 0.5rem;
  color: ${(props) => (props.$isUser ? "#6b7280" : "#111827")};
`;

const MessageTime = styled.span`
  font-size: 0.75rem;
  color: #9ca3af;
`;

const MessageText = styled.p`
  font-size: 0.875rem;
  line-height: 1.5;
  color: #4b5563;
  white-space: pre-wrap;
  word-break: break-word;
`;

const Transcript = ({ items }) => {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [items]);

  // Only display messages and function call-related items
  const displayItems = items.filter(
    (item) =>
      item.type === ItemTypes.MESSAGE ||
      item.type === ItemTypes.FUNCTION_CALL ||
      item.type === ItemTypes.FUNCTION_CALL_OUTPUT
  );

  const hasMessages = displayItems.length > 0;

  return (
    <TranscriptContainer>
      <TranscriptContent>
        {!hasMessages ? (
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
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
            </EmptyIcon>
            <EmptyTitle>No messages yet</EmptyTitle>
            <EmptyDescription>
              Call your Twilio number to start a conversation
            </EmptyDescription>
          </EmptyState>
        ) : (
          displayItems.map((item, index) => {
            const isUser = item.role === RoleTypes.USER;
            const isTool = item.role === RoleTypes.TOOL;

            // Combine all content parts into a single text
            const displayText = item.content
              ? item.content.map((c) => c.text).join("")
              : "";

            return (
              <MessageContainer key={index}>
                <MessageAvatar $role={item.role}>
                  {isUser ? (
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
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                    </svg>
                  ) : isTool ? (
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
                      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"></path>
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
                      <rect
                        x="3"
                        y="11"
                        width="18"
                        height="11"
                        rx="2"
                        ry="2"
                      ></rect>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                    </svg>
                  )}
                </MessageAvatar>
                <MessageContent>
                  <MessageHeader>
                    <MessageSender $isUser={isUser}>
                      {isUser
                        ? "Caller"
                        : isTool
                        ? "Tool Response"
                        : "Assistant"}
                    </MessageSender>
                    <MessageTime>{item.timestamp}</MessageTime>
                  </MessageHeader>
                  <MessageText>{displayText}</MessageText>
                </MessageContent>
              </MessageContainer>
            );
          })
        )}
        <div ref={scrollRef} />
      </TranscriptContent>
    </TranscriptContainer>
  );
};

export default Transcript;
