export const socket = io();

socket.on("connect", () => {
  console.log("✅ Connected to dashboard socket");
});
