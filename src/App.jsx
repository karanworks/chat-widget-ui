import { useEffect } from "react";
import "./App.css";
import ChatWidget from "./Widget/ChatWidget";
import socket from "./socket/socket";

let visitor = JSON.parse(localStorage.getItem("visitor"));
let workspace = JSON.parse(localStorage.getItem("workspace"));
// let workspaceId = localStorage.getItem("widget_workspaceId");

function App() {
  useEffect(() => {
    if (visitor) {
      console.log("VISITOR CONDITION EXECUTED ->", visitor);
      console.log("WORKSPACE ID ON VISITOR JOIN ->", workspace.id);

      socket.emit("visitor-join", { ...visitor, workspaceId: workspace.id });
      socket.emit(
        "visitor-status",
        { visitor, status: "online" },
        workspace.id
      );
    }
  }, []);
  return <ChatWidget socket={socket} />;
}

export default App;
