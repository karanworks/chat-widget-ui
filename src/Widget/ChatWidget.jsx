import { useEffect, useState, useRef } from "react";
import { MessageCircle, Send, X, Minus, MessageCircleX } from "lucide-react";
import "./ChatWidget.css";
import axios from "axios";
import VisitorDetailsForm from "./VisitorDetailsForm";

const ChatWidget = ({ socket }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [widgetStyles, setWidgetStyles] = useState(null);
  const [chatDetails, setDetailsDetails] = useState(null);
  const [response, setResponse] = useState(null);
  const [nameValue, setNameValue] = useState("");
  const [emailValue, setEmailValue] = useState("");
  const [messageValue, setMessageValue] = useState("");
  const [error, setError] = useState("");

  const workspaceId = localStorage.getItem("widget_workspaceId") || null;
  let visitor = JSON.parse(localStorage.getItem("visitor"));

  const messagesEndRef = useRef(null); // Ref to scroll to the last message

  useEffect(() => {
    console.log("WORKSPACE ID ->", workspaceId);
    console.log("SERVER URL ->", import.meta.env.VITE_SERVER_URL);

    axios
      .get(
        `${import.meta.env.VITE_SERVER_URL}/api/widget-settings/${workspaceId}`
      )
      .then((res) => {
        console.log("RESULT ->", res);

        if (res.data.data.theme) {
          setWidgetStyles(res.data.data.theme);
        }
      })
      .catch((err) => {
        console.log("Error while fetching styles for widget ->", err);
      });
  }, []);

  useEffect(() => {
    axios
      .get(
        `${
          import.meta.env.VITE_SERVER_URL
        }/api/visitor-details/${workspaceId}/${visitor.visitorId}`
      )
      .then((res) => {
        setDetailsDetails(res.data.data);
      });
  }, []);

  useEffect(() => {
    axios
      .get(
        `${import.meta.env.VITE_SERVER_URL}/api/visitor-chat/${
          visitor.visitorId
        }`
      )
      .then((res) => {
        setMessages(res.data.data?.messages);
      });
  }, []);

  useEffect(() => {
    socket.on("message", handleMessage);

    return () => {
      socket.off("message", handleMessage);
    };
  }, []);

  // Scroll to the bottom of the chat whenever messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleMessage = (message) => {
    console.log("Message received ->", message);
    setMessages((prevMessages) => {
      return prevMessages ? [...prevMessages, message] : [message];
    });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();

    if (!newMessage) {
      return;
    }

    console.log("CHAT DETAILS ->", chatDetails);

    if (!chatDetails) {
      socket.emit(
        "visitor-message-request",
        {
          workspaceId,
          visitor,
        },
        (response) => {
          setResponse(response);

          if (response.chatId) {
            socket.emit("message", {
              message: { content: newMessage },
              chatId: response.chatId,
              sender: { ...visitor, type: "visitor" },
              to: workspaceId,
            });
          }
        }
      );
    } else {
      socket.emit("message", {
        message: { content: newMessage },
        chatId: chatDetails.id,
        sender: { ...visitor, type: "visitor" },
        to: workspaceId,
      });
    }

    setNewMessage("");
  };

  function handleVisitorDetailFormSubmit(e) {
    e.preventDefault();

    if (!nameValue || !emailValue || !messageValue) {
      setError("Please fill all fields!");
      return;
    }

    socket.emit(
      "visitor-message-request",
      {
        workspaceId,
        visitor,
      },
      (response) => {
        setResponse(response);

        if (response.chatId) {
          socket.emit("message", {
            message: { content: newMessage },
            chatId: response.chatId,
            sender: { ...visitor, type: "visitor" },
            to: workspaceId,
          });
        }
      }
    );
  }

  return (
    <div className="chat-container">
      <div className="chat-button-wrapper">
        {isOpen && (
          <div className={`chat-window ${isMinimized ? "minimized" : ""}`}>
            <div
              className="chat-header"
              style={{ display: "flex", alignItems: "center" }}
            >
              <div className="chat-title">
                <MessageCircle
                  style={{ color: widgetStyles.logoColor || "#3BA9E5" }}
                />
                <span style={{ fontSize: "20px" }}>Chat with us</span>
              </div>
              <div className="chat-controls">
                <button onClick={() => setIsMinimized(!isMinimized)}>
                  <Minus />
                </button>
                <button onClick={() => setIsOpen(false)}>
                  <X />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                <div className="chat-messages">
                  {messages?.length > 0 ? (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`message-wrapper ${message.sender.type}`}
                      >
                        <div
                          style={{ display: "flex", flexDirection: "column" }}
                        >
                          <div className="message">{message.content}</div>

                          {message.sender.type === "agent" && (
                            <div>
                              <span
                                style={{ fontSize: "12px", color: "#787878" }}
                              >
                                {message.sender.name}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <VisitorDetailsForm
                      nameValue={nameValue}
                      setNameValue={setNameValue}
                      emailValue={emailValue}
                      setEmailValue={setEmailValue}
                      messageValue={messageValue}
                      setMessageValue={setMessageValue}
                      error={error}
                      handleVisitorDetailFormSubmit={
                        handleVisitorDetailFormSubmit
                      }
                    />
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {messages?.length > 0 && (
                  <form
                    onSubmit={handleSendMessage}
                    className="chat-input-form"
                  >
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message..."
                    />
                    <button
                      type="submit"
                      style={{
                        backgroundColor:
                          widgetStyles.sendButtonBackgroundColor || "#3BA9E5",
                      }}
                    >
                      <Send />
                    </button>
                  </form>
                )}
              </>
            )}
          </div>
        )}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`chat-toggle-button ${isOpen ? "active" : ""}`}
          style={{
            backgroundColor: widgetStyles?.backgroundColor || "#3BA9E5",
            color: widgetStyles?.textColor || "#ffffff",
          }}
        >
          {isOpen ? <MessageCircleX /> : <MessageCircle />}
        </button>
      </div>
    </div>
  );
};

export default ChatWidget;
