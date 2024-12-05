import { useEffect, useState } from "react";
import { MessageCircle, Send, X, Minus, MessageCircleX } from "lucide-react";
import "./ChatWidget.css";
import axios from "axios";
import { v4 as uuid } from "uuid";

const ChatWidget = ({ socket }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [widgetStyles, setWidgetStyles] = useState(null);
  const [chatDetails, setDetailsDetails] = useState(null);
  const [response, setResponse] = useState(null);

  const workspaceId = localStorage.getItem("widget_workspaceId") || null;
  let visitor = JSON.parse(localStorage.getItem("visitor"));

  useEffect(() => {
    console.log("WORKSPACE ID ->", workspaceId);

    axios
      .get(`http://localhost:3010/api/widget-settings/${workspaceId}`)
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
        `http://localhost:3010/api/visitor-details/${workspaceId}/${visitor.visitorId}`
      )
      .then((res) => {
        setDetailsDetails(res.data.data);
      });
  }, []);

  useEffect(() => {
    axios
      .get(`http://localhost:3010/api/visitor-chat/${visitor.visitorId}`)
      .then((res) => {
        setMessages(res.data.data?.messages);
      });
  }, []);

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

    // ********************************************************
    // ************** THIS CAUSES ANOTHER EVENT ***************
    // ********************************************************

    setNewMessage("");
    // }
  };

  const handleMessage = (message) => {
    console.log("Message received ->", message);
    setMessages((prevMessages) => {
      console.log("PREV MESSAGES ->", prevMessages);
      console.log("MESSAGE ->", message);

      return prevMessages ? [...prevMessages, message] : [message];
    });
  };

  useEffect(() => {
    socket.on("message", handleMessage);

    return () => {
      socket.off("message", handleMessage);
    };
  }, []);

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
                  {messages?.length > 0 &&
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`message-wrapper ${message.sender.type}`}
                      >
                        {/* {console.log(message)} */}
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
