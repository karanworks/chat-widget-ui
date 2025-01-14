import { useEffect } from "react";
import "./App.css";
import ChatWidget from "./Widget/ChatWidget";
import socket from "./socket/socket";

let visitor = JSON.parse(localStorage.getItem("visitor"));
let workspaceId = localStorage.getItem("widget_workspaceId");

function App() {
  useEffect(() => {
    if (visitor) {
      console.log("VISITOR CONDITION EXECUTED ->", visitor);
      console.log("WORKSPACE ID ON VISITOR JOIN ->", workspaceId);

      socket.emit("visitor-join", { ...visitor, workspaceId });
      socket.emit("visitor-status", { visitor, status: "online" }, workspaceId);
    }
  }, []);
  return <ChatWidget socket={socket} />;
}

export default App;
