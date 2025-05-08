import React, { useState } from "react";
import styled from "styled-components";
import axios from "axios";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";

const FormContainer = styled.div`
  max-width: 500px;
  width: 100%;
  padding: 2.5rem;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s ease;

  &:hover {
    transform: translateY(-5px);
  }
`;

const Title = styled.h1`
  font-size: 2rem;
  margin-bottom: 0.5rem;
  color: #333;
  text-align: center;
`;

const Subtitle = styled.p`
  font-size: 1rem;
  color: #666;
  margin-bottom: 2rem;
  text-align: center;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
`;

// Improved PhoneInput styling
const PhoneInputContainer = styled.div`
  width: 100%;

  .PhoneInput {
    display: flex;
    width: 100%;
    align-items: center;
    border: 1px solid #ddd;
    border-radius: 8px;
    overflow: hidden;
    transition: border-color 0.3s;

    &:focus-within {
      border-color: #6e8efb;
      box-shadow: 0 0 0 2px rgba(110, 142, 251, 0.2);
    }
  }

  .PhoneInputInput {
    flex: 1;
    min-width: 0;
    width: 100%;
    padding: 0.8rem;
    border: none;
    font-size: 1rem;
    outline: none;
    background-color: transparent;

    &:focus {
      outline: none;
    }
  }

  .PhoneInputCountry {
    display: flex;
    align-items: center;
    background-color: #f5f5f5;
    padding: 0.6rem 0.8rem;
    margin: 0;
    cursor: pointer;
    transition: background-color 0.2s;

    &:hover {
      background-color: #e9e9e9;
    }
  }

  /* Make the whole country area clickable */
  .PhoneInputCountrySelect {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
    z-index: 1;
    border: 0;
    opacity: 0;
    cursor: pointer;
  }

  .PhoneInputCountryIcon {
    width: 24px;
    height: 18px;
    margin-right: 0.5rem;
    border-radius: 3px;
    overflow: hidden;
  }

  .PhoneInputCountrySelectArrow {
    width: 0;
    height: 0;
    border-style: solid;
    border-width: 5px 4px 0 4px;
    border-color: #999 transparent transparent transparent;
    margin-left: 0.5rem;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  width: 100%;
  justify-content: center;
`;

const SubmitButton = styled.button`
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: 1.5rem;
  background: linear-gradient(135deg, #9966ff, #3b82f6);
  color: white;

  &:hover {
    opacity: 0.9;
  }

  &:disabled {
    background: white;
    color: #8a70ff;
    border: 1px solid #8a70ff;
    cursor: not-allowed;
  }

  &:disabled:hover {
    background: #f0edff;
  }
`;

const SecondaryButton = styled(SubmitButton)`
  background: white;
  color: var(--primary);
  border: 1px solid var(--primary);

  &:hover {
    background: var(--primary-light);
  }
`;

const Message = styled.div`
  margin-bottom: 1.5rem;
  padding: 1rem;
  border-radius: 8px;
  background-color: #f8f9ff;
  border: 1px solid #e0e7ff;
  color: #4338ca;
`;

const ErrorMessage = styled.div`
  color: #e74c3c;
  font-size: 0.9rem;
  margin-top: 0.5rem;
`;

const Hint = styled.p`
  color: #888;
  font-size: 0.8rem;
  margin-top: 0.3rem;
`;

const SignupForm = ({ onSignupSuccess }) => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userExists, setUserExists] = useState(false);
  const [resetMessage, setResetMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Simple validation
    if (!phoneNumber || phoneNumber.trim() === "") {
      setError("Please enter your phone number");
      return;
    }

    setIsLoading(true);
    setError("");
    setResetMessage("");

    try {
      const response = await axios.post("/api/auth/signup", { phoneNumber });

      // Handle case where user already exists
      if (response.data.userExists) {
        setUserExists(true);
        setResetMessage(response.data.message);
      } else if (response.data.isReset) {
        // Handle successful reset
        setResetMessage(response.data.message);
        setTimeout(() => {
          onSignupSuccess();
        }, 2000);
      } else {
        // Handle successful new signup
        onSignupSuccess();
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to sign up. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetConversation = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await axios.post("/api/auth/signup", {
        phoneNumber,
        resetConversation: true,
      });

      setResetMessage(response.data.message);
      setUserExists(false);

      setTimeout(() => {
        onSignupSuccess();
      }, 2000);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Failed to reset conversation. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <FormContainer className="animate__animated animate__fadeInUp">
      <Title>Welcome to Mate AI</Title>
      <Subtitle>
        Enter your phone number to start chatting with our AI assistant
      </Subtitle>

      {resetMessage && <Message>{resetMessage}</Message>}

      <Form onSubmit={handleSubmit}>
        <FormGroup>
          <Label htmlFor="phoneNumber">Phone Number</Label>
          <PhoneInputContainer>
            <PhoneInput
              international
              defaultCountry="US"
              placeholder="Enter phone number"
              value={phoneNumber}
              onChange={setPhoneNumber}
              disabled={userExists || isLoading}
            />
          </PhoneInputContainer>
          <Hint>We'll send you a welcome message to this number</Hint>
          {error && <ErrorMessage>{error}</ErrorMessage>}
        </FormGroup>

        {userExists ? (
          <ButtonGroup>
            <SecondaryButton
              type="button"
              onClick={() => setUserExists(false)}
              disabled={isLoading}
            >
              Cancel
            </SecondaryButton>
            <SubmitButton
              type="button"
              onClick={handleResetConversation}
              disabled={isLoading}
            >
              {isLoading ? "Processing..." : "Reset Conversation"}
            </SubmitButton>
          </ButtonGroup>
        ) : (
          <SubmitButton type="submit" disabled={isLoading}>
            {isLoading ? "Signing Up..." : "Get Started"}
          </SubmitButton>
        )}
      </Form>
    </FormContainer>
  );
};

export default SignupForm;
