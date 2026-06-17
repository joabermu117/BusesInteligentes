import { useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { getAuthUserId } from "../../config/httpClient";

const SOCKET_URL = (import.meta.env.VITE_API_URL || "http://localhost:3000") + "/notifications";

let sharedSocket: Socket | null = null;
let refCount = 0;

const getSocket = (): Socket => {
  if (!sharedSocket) {
    sharedSocket = io(SOCKET_URL, {
      transports: ["websocket"],
      reconnectionAttempts: 20,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10_000,
    });
  }
  return sharedSocket;
};

export const useSocket = (
  handlers: Record<string, (data: any) => void>,
  onConnectionChange?: (connected: boolean) => void,
) => {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;
  const onConnectionChangeRef = useRef(onConnectionChange);
  onConnectionChangeRef.current = onConnectionChange;

  useEffect(() => {
    const socket = getSocket();
    refCount++;
    const personId = getAuthUserId();

    const onConnect = () => {
      if (personId) socket.emit("join-room", { personId });
      onConnectionChangeRef.current?.(true);
    };
    const onDisconnect = () => onConnectionChangeRef.current?.(false);

    if (socket.connected) onConnect();

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    // Cada hook registra sus propios wrappers; el cleanup solo remueve los suyos
    // (socket.off(event) sin referencia borraría también los listeners de otros componentes).
    const wrappers = Object.keys(handlersRef.current).map((event) => {
      const fn = (data: any) => handlersRef.current[event]?.(data);
      socket.on(event, fn);
      return { event, fn };
    });

    return () => {
      refCount--;
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      wrappers.forEach(({ event, fn }) => socket.off(event, fn));

      if (refCount <= 0) {
        sharedSocket?.disconnect();
        sharedSocket = null;
      }
    };
  }, []);
};
