import React, { useState } from "react";
import "./VisitorDetailsForm.css";

function VisitorDetailsForm({
  nameValue,
  setNameValue,
  emailValue,
  setEmailValue,
  error,
  handleVisitorDetailFormSubmit,
  newMessage,
  setNewMessage,
}) {
  return (
    <div className="wrapper">
      <div className="main-container">
        <h1 className="heading">Please Introduce Yourself !</h1>

        {error && (
          <div role="alert" className="error-message">
            {error}
          </div>
        )}
        <form
          onSubmit={handleVisitorDetailFormSubmit}
          style={{ width: "100%" }}
        >
          <div className="form-container">
            <div className="input-container">
              <label htmlFor="name">Name</label>
              <input
                type="text"
                className="input-field"
                placeholder="Type your name"
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
              />
            </div>

            <div className="input-container">
              <label htmlFor="email">Email</label>

              <input
                type="text"
                className="input-field"
                placeholder="Type your email"
                value={emailValue}
                onChange={(e) => setEmailValue(e.target.value)}
              />
            </div>

            <div className="input-container">
              <label htmlFor="message">Message</label>

              <input
                type="text"
                className="input-field"
                placeholder="Type your message"
                // value={messageValue}
                value={newMessage}
                // onChange={(e) => setMessageValue(e.target.value)}
                onChange={(e) => setNewMessage(e.target.value)}
              />
            </div>

            <button className="start-chat-btn" type="submit">
              Start Chat
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default VisitorDetailsForm;
