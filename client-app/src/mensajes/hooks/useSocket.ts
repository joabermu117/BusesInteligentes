import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { getAuthUserId } from "../../config/httpClient";

const SOCKET_URL = (import.meta.env.VITE_API_URL || "http://localhost:3000") + "/notifications";

let sharedSocket: Socket | null = null;

const getSocket = (): Socket => {
  if (!sharedSocket || !sharedSocket.connected) {
    sharedSocket = io(SOCKET_URL, {
      transports: ["websocket"],
      reconnectionAttempts: 5,
    });
  }
  return sharedSocket;
};

export const useSocket = (
  handlers: Record<string, (data: any) => void>,
) => {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    const socket = getSocket();
    const personId = getAuthUserId();

    const onConnect = () => {
      if (personId) {
        socket.emit("join-room", { personId });
      }
    };

    if (socket.connected) {
      onConnect();
    }

    socket.on("connect", onConnect);

    const eventNames = Object.keys(handlersRef.current);
    for (const event of eventNames) {
      socket.on(event, (data) => handlersRef.current[event]?.(data));
    }

    return () => {
      socket.off("connect", onConnect);
      for (const event of eventNames) {
        socket.off(event);
      }
    };
  }, []);
};
