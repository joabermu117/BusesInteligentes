import { getMessaging, getToken, onMessage, type Messaging } from "firebase/messaging";
import { firebaseAuth } from "../../config/firebase";
import httpClient from "../../config/httpClient";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

let messaging: Messaging | null = null;
let tokenRefreshed = false;

/**
 * Obtiene la instancia de Firebase Messaging.
 * Solo disponible en navegadores que soporten service workers.
 */
const getMessagingInstance = (): Messaging | null => {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return null;
  }
  if (!messaging) {
    try {
      messaging = getMessaging();
    } catch {
      return null;
    }
  }
  return messaging;
};

/**
 * Solicita permiso para notificaciones push y registra el token FCM.
 * @returns El token FCM o null si no se pudo obtener.
 */
export const requestPushPermission = async (): Promise<string | null> => {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.warn("[FCM] Permiso de notificaciones denegado");
      return null;
    }

    const instance = getMessagingInstance();
    if (!instance) {
      console.warn("[FCM] Firebase Messaging no disponible");
      return null;
    }

    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
    const token = await getToken(instance, {
      vapidKey: vapidKey || undefined,
    });

    if (token) {
      await registerTokenOnServer(token);
    }

    return token;
  } catch (err) {
    console.error("[FCM] Error al obtener token:", err);
    return null;
  }
};

/**
 * Registra el token FCM en el backend para recibir notificaciones push.
 */
const registerTokenOnServer = async (token: string): Promise<void> => {
  try {
    const user = firebaseAuth.currentUser;
    if (!user?.uid) return;

    await httpClient.post(`${API_URL}/api/notifications/fcm/register`, {
      userId: user.uid,
      fcmToken: token,
    });
  } catch (err) {
    console.error("[FCM] Error al registrar token en servidor:", err);
  }
};

/**
 * Escucha mensajes entrantes mientras la app está en foreground.
 * @param callback Función que se ejecuta al recibir un mensaje.
 */
export const onForegroundMessage = (
  callback: (payload: { title?: string; body?: string; data?: Record<string, string> }) => void,
): (() => void) => {
  const instance = getMessagingInstance();
  if (!instance) return () => {};

  const unsubscribe = onMessage(instance, (payload) => {
    const notification = payload.notification;
    const data = payload.data as Record<string, string> | undefined;
    callback({
      title: notification?.title,
      body: notification?.body,
      data,
    });
  });

  return unsubscribe;
};

/**
 * Inicializa la escucha de mensajes en foreground.
 * Debe llamarse al cargar la app.
 */
export const initForegroundListener = (): (() => void) => {
  return onForegroundMessage(({ title, body, data }) => {
    // Los mensajes entrantes en foreground se manejan a través del toast de WebSocket
    // Esta función se mantiene como respaldo
    if (data?.is_urgent === "true" && Notification.permission === "granted") {
      new Notification(title ?? "Alerta urgente", {
        body: body ?? "",
        icon: "/favicon.ico",
        tag: "urgent-alert",
      });
    }
  });
};
