import { useEffect } from "react";
import "./App.css";
import ChatWidget from "./Widget/ChatWidget";
import socket from "./socket/socket";
import { v4 as uuid } from "uuid";

function generateRandomName() {
  const randomNumber = Math.floor(100000 + Math.random() * 900000); // Ensures a 6-digit number
  return `ASC${randomNumber}`;
}

let visitor = JSON.parse(localStorage.getItem("visitor"));

if (!visitor) {
  visitor = {
    visitorId: uuid(),
    name: generateRandomName(),
  };

  localStorage.setItem("visitor", JSON.stringify(visitor));
}

function App() {
  useEffect(() => {
    socket.emit("visitor-join", visitor);
  }, []);
  return <ChatWidget socket={socket} />;
}

export default App;
