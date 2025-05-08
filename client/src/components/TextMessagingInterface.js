import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import axios from "axios";

const Container = styled.div`
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  height: 70vh;
  width: 100%;
  max-width: 800px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const Header = styled.div`
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
`;

const Avatar = styled.div`
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background-color: #6e8efb;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 1rem;
  color: white;
  font-weight: 600;
`;

const HeaderInfo = styled.div`
  display: flex;
  flex-direction: column;
`;

const AssistantName = styled.h3`
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
`;

const Status = styled.span`
  font-size: 0.85rem;
  color: #65a30d;
`;

const ConversationContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
`;

const MessageGroup = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;
  max-width: 70%;
  align-self: ${(props) => (props.$isUser ? "flex-end" : "flex-start")};
  animation: ${(props) => (props.$isUser ? "slideInRight" : "slideInLeft")} 0.3s
    ease-out;
`;

const MessageBubble = styled.div`
  padding: 0.75rem 1rem;
  border-radius: 18px;
  font-size: 0.95rem;
  line-height: 1.5;
  margin-bottom: 0.25rem;
  background-color: ${(props) => (props.$isUser ? "#6e8efb" : "#f3f4f6")};
  color: ${(props) => (props.$isUser ? "white" : "#4b5563")};
  border-bottom-right-radius: ${(props) => (props.$isUser ? "4px" : "18px")};
  border-bottom-left-radius: ${(props) => (!props.$isUser ? "4px" : "18px")};
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  white-space: pre-wrap;
  word-break: break-word;
`;

const MessageTime = styled.span`
  font-size: 0.75rem;
  color: #9ca3af;
  align-self: ${(props) => (props.$isUser ? "flex-end" : "flex-start")};
  margin: 0 0.5rem;
`;

const NoMessages = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  text-align: center;
  padding: 2rem;
`;

const PhoneEmoji = styled.div`
  font-size: 3rem;
  margin-bottom: 1rem;
`;

const RefreshButton = styled.button`
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background-color: #6e8efb;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #5a7df9;
  }
`;

const TextMessagingInterface = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [phone, setPhone] = useState("");

  const bottomRef = useRef(null);

  useEffect(() => {
    fetchMessages();

    // Poll for new messages every 10 seconds
    const intervalId = setInterval(fetchMessages, 10000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/messages");
      console.log("API response:", response.data);

      if (response.data && response.data.messages) {
        setMessages(response.data.messages);
      }
      if (response.data && response.data.phoneNumber) {
        setPhone(response.data.phoneNumber);
      }
      setLoading(false);
    } catch (err) {
      console.error("Error fetching messages:", err);
      setError("Failed to load messages. Please try again.");
      setLoading(false);
    }
  };

  // Format timestamp to readable time
  const formatTime = (timestamp) => {
    if (!timestamp) return "";

    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <Container>
      <Header>
        <Avatar>M</Avatar>
        <HeaderInfo>
          <AssistantName>Mate AI</AssistantName>
          <Status>Active - Ready to chat</Status>
        </HeaderInfo>
      </Header>

      <ConversationContainer>
        {loading && messages.length === 0 ? (
          <NoMessages>Loading messages...</NoMessages>
        ) : error ? (
          <NoMessages>
            <div>{error}</div>
            <RefreshButton onClick={fetchMessages}>Retry</RefreshButton>
          </NoMessages>
        ) : messages.length === 0 ? (
          <NoMessages>
            <PhoneEmoji>📱</PhoneEmoji>
            <h3>No messages yet</h3>
            <p>Text {phone} to start chatting with Mate AI</p>
            <RefreshButton onClick={fetchMessages}>Refresh</RefreshButton>
          </NoMessages>
        ) : (
          <>
            {messages.map((message, index) => (
              <MessageGroup key={index} $isUser={message.from === "user"}>
                <MessageBubble $isUser={message.from === "user"}>
                  {message.content}
                </MessageBubble>
                <MessageTime $isUser={message.from === "user"}>
                  {formatTime(message.timestamp)}
                </MessageTime>
              </MessageGroup>
            ))}
            <div ref={bottomRef} />
          </>
        )}
      </ConversationContainer>
    </Container>
  );
};

export default TextMessagingInterface;
