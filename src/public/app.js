document.addEventListener("DOMContentLoaded", () => {
  const signupForm = document.getElementById("signupForm");
  const statusMessage = document.getElementById("status-message");

  // Phone number validation regex (US format)
  const phoneRegex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;

  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    // Get form data
    const phoneNumberInput = document.getElementById("phoneNumber");
    const phoneNumber = phoneNumberInput.value.trim();

    // Validate phone number
    if (!phoneRegex.test(phoneNumber)) {
      showStatus("Please enter a valid US phone number", "error");
      return;
    }

    try {
      // Send registration request
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phoneNumber }),
      });

      const data = await response.json();

      if (response.ok) {
        // Registration successful
        showStatus(
          "Registration successful! Check your iMessage for a welcome message.",
          "success"
        );
        signupForm.reset();
      } else {
        // Registration failed
        showStatus(
          data.message || "Registration failed. Please try again.",
          "error"
        );
      }
    } catch (error) {
      showStatus("An error occurred. Please try again later.", "error");
      console.error("Error:", error);
    }
  });

  /**
   * Show status message
   * @param {string} message - Message to display
   * @param {string} type - Message type ('success' or 'error')
   */
  function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = "status-message";
    statusMessage.classList.add(type);

    // Scroll to status message
    statusMessage.scrollIntoView({ behavior: "smooth" });

    // Clear message after 5 seconds for success messages
    if (type === "success") {
      setTimeout(() => {
        statusMessage.textContent = "";
        statusMessage.className = "status-message";
      }, 5000);
    }
  }
});
