import { useEffect, useState, useRef, useMemo, useCallback } from "react";
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
  const [chatDetails, setChatDetails] = useState(null);
  const [nameValue, setNameValue] = useState("");
  const [emailValue, setEmailValue] = useState("");
  const [error, setError] = useState("");
  const [visitor, setVisitor] = useState(() => {
    const storedVisitor = localStorage.getItem("visitor");
    return storedVisitor ? JSON.parse(storedVisitor) : null;
  });
  const [isTyping, setIsTyping] = useState(false);

  // const workspaceId = localStorage.getItem("widget_workspaceId") || null;
  const workspace = JSON.parse(localStorage.getItem("workspace")) || null;
  // let visitor = JSON.parse(localStorage.getItem("visitor"));

  const messagesEndRef = useRef(null); // Ref to scroll to the last message

  useEffect(() => {
    if (!workspace.isWidgetConnected) {
      axios
        .patch(
          `${import.meta.env.VITE_SERVER_URL}/api/widget-status/update/${
            workspace.id
          }`
        )
        .then((res) => {
          localStorage.setItem("workspace", JSON.stringify(res.data.data));
          console.log("WIDGET STATUS UPDATED ->", res);

          socket.emit("widget-connected", res.data.data);
        })
        .catch((err) => {
          console.log("Error while updating widget status ->", err);
        });
    }
  }, []);

  useEffect(() => {
    axios
      .get(
        `${import.meta.env.VITE_SERVER_URL}/api/widget-settings/${workspace.id}`
      )
      .then((res) => {
        if (res.data.data.theme) {
          setWidgetStyles(res.data.data.theme);
        }
      })
      .catch((err) => {
        console.log("Error while fetching styles for widget ->", err);
      });
  }, []);

  useEffect(() => {
    if (visitor) {
      axios
        .get(
          `${import.meta.env.VITE_SERVER_URL}/api/visitor-details/${
            workspace.id
          }/${visitor?.id}`
        )
        .then((res) => {
          {
            console.log(
              "VISITOR IN VISITOR-MESSAGE-REQUEST EVENT ->",
              res.data.data
            );
          }
          setChatDetails(res.data.data);
        });
    }
  }, [visitor]);

  useEffect(() => {
    if (visitor) {
      axios
        .get(
          `${import.meta.env.VITE_SERVER_URL}/api/visitor-chat/${visitor?.id}`
        )
        .then((res) => {
          setMessages(res.data.data?.messages);
        });
    }
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

  const handleMessageRequest = useCallback(
    (visitor) => {
      socket.emit(
        "visitor-message-request",
        {
          workspaceId: workspace.id,
          visitor,
        },
        (chat) => {
          {
            console.log("VISITOR IN VISITOR-MESSAGE-REQUEST EVENT ->", chat);
          }
          setChatDetails(chat);

          if (chat.id) {
            socket.emit("message", {
              message: { content: newMessage },
              chatId: chat.id,
              sender: { ...visitor, type: "visitor" },
              to: workspace.id,
            });
          }

          setNewMessage("");
          socket.emit(
            "visitor-status",
            {
              visitor: { ...visitor, chatId: chat.id },
              status: "online",
            },
            workspace.id
          );

          console.log("GETTING WORKSPACE FOR TESTING ->", workspace);

          if (visitor) {
            localStorage.setItem(
              "visitor",
              JSON.stringify({ ...visitor, chatId: chat.id })
            );

            setVisitor(visitor);
          }
        }
      );
    },
    [newMessage, socket, workspace.id]
  );

  useEffect(() => {
    socket.on("visitor-joined", handleMessageRequest);

    return () => {
      socket.off("visitor-joined", handleMessageRequest);
    };
  }, [handleMessageRequest, socket]);

  const handleMessage = (message) => {
    setMessages((prevMessages) => {
      return prevMessages ? [...prevMessages, message] : [message];
    });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();

    if (!newMessage) {
      return;
    }

    socket.emit("message", {
      message: { content: newMessage },
      chatId: chatDetails?.id,
      sender: { ...visitor, type: "visitor" },
      to: workspace.id,
    });

    setNewMessage("");
  };

  function handleVisitorDetailFormSubmit(e) {
    e.preventDefault();

    if (!nameValue || !emailValue) {
      setError("Please fill all fields!");
      return;
    }

    socket.emit("visitor-join", {
      name: nameValue,
      email: emailValue,
      workspaceId: workspace.id,
    });

    // socket.emit("visitor-status", { visitor, status: "online" }, workspaceId);
  }

  useEffect(() => {
    const initialHeight = isOpen ? "600px" : "80px";
    const initialWidth = isOpen ? "350px" : "75px";
    window.parent.postMessage(
      { type: "resizeIframe", height: initialHeight, width: initialWidth },
      "*"
    );
  }, [isOpen]);

  function handleChatWidgetState() {
    console.log("CHAT WIDGET IS ->", isOpen);

    setIsOpen(!isOpen);

    const height = isOpen ? "600px" : "80px";
    const width = isOpen ? "350px" : "75px";
    window.parent.postMessage({ type: "resizeIframe", height, width }, "*");
    // socket.emit("", {
    //   chatId: chatDetails.id,
    //   state: isOpen ? "close" : "open",
    //   workspaceId,
    // });
  }

  function handleTypingStatus(user) {
    console.log("USER ->", user);
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
    }, 2000);
  }

  useEffect(() => {
    socket.on("typing", handleTypingStatus);

    return () => {
      socket.off(handleTypingStatus);
    };
  }, []);

  function handleMessageTyping(e) {
    setNewMessage(e.target.value);
    socket.emit("typing", {
      user: { ...visitor, type: "visitor", workspaceId: workspace.id },
    });
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
                <span className="chat-header-heading">Chat with us</span>
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
                        key={message?.id}
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
                      error={error}
                      handleVisitorDetailFormSubmit={
                        handleVisitorDetailFormSubmit
                      }
                      newMessage={newMessage}
                      setNewMessage={setNewMessage}
                    />
                  )}
                  {isTyping && (
                    <div className="message-wrapper agent">
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <div className="message">
                          <div className="typing-indicator">
                            <div className="typing-dot"></div>
                            <div className="typing-dot"></div>
                            <div className="typing-dot"></div>
                          </div>
                        </div>
                      </div>
                    </div>
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
                      onChange={handleMessageTyping}
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
          onClick={handleChatWidgetState}
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
