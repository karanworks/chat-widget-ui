import { io } from "socket.io-client";

// const socket = io(import.meta.env.VITE_SERVER_URL);
const socket = io("https://ascent-bpo.com");

export default socket;
