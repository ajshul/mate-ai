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

// Improved phone input styling
const PhoneInputContainer = styled.div`
  .PhoneInput {
    display: flex;
    align-items: center;
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 0.25rem 0.5rem;
    transition: border-color 0.3s;

    &:focus-within {
      border-color: #6e8efb;
      box-shadow: 0 0 0 2px rgba(110, 142, 251, 0.2);
    }
  }

  .PhoneInputInput {
    flex: 1;
    min-width: 0;
    padding: 0.8rem 0.5rem;
    border: none;
    font-size: 1rem;
    transition: all 0.3s;

    &:focus {
      outline: none;
    }
  }

  .PhoneInputCountry {
    display: flex;
    align-items: center;
    margin-right: 0.5rem;
  }

  .PhoneInputCountryIcon {
    width: 26px;
    height: 20px;
    border-radius: 3px;
    overflow: hidden;
    margin-right: 0.5rem;
  }

  .PhoneInputCountrySelectArrow {
    margin-left: 0.5rem;
    width: 0;
    height: 0;
    border-style: solid;
    border-width: 4px 4px 0 4px;
    border-color: #999 transparent transparent transparent;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  width: 100%;
  justify-content: center;
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
  min-width: ${(props) => (props.fullWidth ? "auto" : "140px")};
  text-align: center;

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

const SignupForm = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      await axios.post("/api/auth/register", { phoneNumber });
      setSuccess(true);
    } catch (err) {
      console.error("Error registering:", err);
      setError(
        err.response?.data?.message || "An error occurred during registration"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <FormContainer>
        <Title>Success!</Title>
        <Message>
          We've sent a welcome message to your phone. Please check your messages
          and reply to start chatting with Mate AI!
        </Message>
      </FormContainer>
    );
  }

  return (
    <FormContainer>
      <Title>Welcome to Mate AI</Title>
      <Subtitle>
        Enter your phone number to start chatting with our AI assistant
      </Subtitle>

      <Form onSubmit={handleSubmit}>
        <FormGroup>
          <Label htmlFor="phoneNumber">Phone Number</Label>
          <PhoneInputContainer>
            <PhoneInput
              international
              defaultCountry="CA"
              value={phoneNumber}
              onChange={setPhoneNumber}
              inputComponent={React.forwardRef((props, ref) => (
                <input id="phoneNumber" ref={ref} {...props} />
              ))}
            />
          </PhoneInputContainer>
          <Hint>We'll send you a welcome message to this number</Hint>
          {error && <ErrorMessage>{error}</ErrorMessage>}
        </FormGroup>

        <Button type="submit" fullWidth disabled={submitting}>
          {submitting ? "Processing..." : "Get Started"}
        </Button>
      </Form>
    </FormContainer>
  );
};

export default SignupForm;
