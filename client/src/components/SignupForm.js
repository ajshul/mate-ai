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

// Add custom styles to override the default PhoneInput styling
const PhoneInputContainer = styled.div`
  .PhoneInput {
    display: flex;
    align-items: center;
  }

  .PhoneInputInput {
    flex: 1;
    min-width: 0;
    padding: 0.8rem 1rem;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-size: 1rem;
    transition: border-color 0.3s;

    &:focus {
      outline: none;
      border-color: #6e8efb;
      box-shadow: 0 0 0 2px rgba(110, 142, 251, 0.2);
    }
  }

  .PhoneInputCountryIcon {
    margin-right: 0.8rem;
  }

  .PhoneInputCountry {
    margin-right: 0.5rem;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  width: 100%;
`;

const Button = styled.button`
  background: linear-gradient(135deg, #6e8efb, #a777e3);
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0.8rem;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  flex: ${(props) => (props.fullWidth ? "1" : "none")};

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(110, 142, 251, 0.3);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
    transform: none;
  }
`;

const SecondaryButton = styled(Button)`
  background: white;
  color: #6e8efb;
  border: 1px solid #6e8efb;

  &:hover {
    background: #f8f9ff;
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
            <Button
              type="button"
              onClick={handleResetConversation}
              disabled={isLoading}
            >
              {isLoading ? "Processing..." : "Reset Conversation"}
            </Button>
          </ButtonGroup>
        ) : (
          <Button type="submit" disabled={isLoading} fullWidth>
            {isLoading ? "Signing Up..." : "Get Started"}
          </Button>
        )}
      </Form>
    </FormContainer>
  );
};

export default SignupForm;
