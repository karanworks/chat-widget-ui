import { useEffect, useState } from "react";
import { MessageCircle, Send, X, Minus, MessageCircleX } from "lucide-react";
import "./ChatWidget.css";
import axios from "axios";
import { v4 as uuid } from "uuid";

const ChatWidget = ({ socket }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    { id: 1, text: "Hello! How can I help you today?", sender: "agent" },
  ]);
  const [newMessage, setNewMessage] = useState("");
  const [widgetStyles, setWidgetStyles] = useState(null);

  const workspaceId = localStorage.getItem("widget_workspaceId") || null;
  let visitor = JSON.parse(localStorage.getItem("visitor"));

  useEffect(() => {
    axios
      .get(`http://localhost:3010/api/widget-settings/${workspaceId}`)
      .then((res) => {
        if (res.data.data.theme) {
          setWidgetStyles(res.data.data.theme);
        }
      })
      .catch((err) => {
        console.log("Error while fetching styles for widget ->", err);
      });
  }, []);

  const handleSendMessage = (e) => {
    e.preventDefault();

    socket.emit(
      "visitor-message-request",
      {
        workspaceId,
        visitor,
      },
      (response) => {
        console.log("RECEIVED RESPONSE ->", response);

        socket.emit("message", {
          message: { content: newMessage },
          chatId: response.chatId,
          sender: visitor,
          visitorRequestId: response.id,
          workspaceId,
        });
      }
    );

    socket.on("visitor-message-request", (request) => {
      console.log("REQUEST ->", request);
    });

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        text: newMessage,
        sender: "user",
      },
    ]);

    setNewMessage("");
    // }
  };

  return (
    <div className="chat-container">
      <div className="chat-button-wrapper">
        {isOpen && (
          <div className={`chat-window ${isMinimized ? "minimized" : ""}`}>
            <div className="chat-header">
              <div className="chat-title">
                <MessageCircle
                  style={{ color: widgetStyles.logoColor || "#3BA9E5" }}
                />
                <span>Chat with us</span>
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
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`message-wrapper ${message.sender}`}
                    >
                      <div className="message">{message.text}</div>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSendMessage} className="chat-input-form">
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
