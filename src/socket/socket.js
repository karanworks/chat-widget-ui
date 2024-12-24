import { io } from "socket.io-client";

// const socket = io("http://localhost:3010");
console.log("SOCKET URL ->", import.meta.env.VITE_SERVER_URL);

const socket = io(import.meta.env.VITE_SERVER_URL);

export default socket;
