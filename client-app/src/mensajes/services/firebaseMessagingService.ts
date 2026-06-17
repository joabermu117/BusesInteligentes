import { getMessaging, getToken, onMessage, type Messaging } from "firebase/messaging";
import { firebaseApp } from "../../config/firebase";
import httpClient, { getAuthUserId } from "../../config/httpClient";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

let messaging: Messaging | null = null;
let swRegistrationRef: ServiceWorkerRegistration | null = null;

const getMessagingInstance = (): Messaging | null => {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return null;
  }
  if (!messaging) {
    try {
      messaging = getMessaging(firebaseApp);
    } catch {
      return null;
    }
  }
  return messaging;
};

/**
 * Registra el Service Worker manualmente con un timeout corto
 * para evitar el error "Service worker not registered after 10000 ms".
 */
const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
  if (swRegistrationRef) return swRegistrationRef;

  // Ya existe un SW registrado?
  const existing = await navigator.serviceWorker.getRegistration("/firebase-messaging-sw.js");
  if (existing) {
    swRegistrationRef = existing;
    return existing;
  }

  // Timeout para no bloquear la app
  const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000));

  try {
    const reg = await Promise.race([
      navigator.serviceWorker.register("/firebase-messaging-sw.js"),
      timeoutPromise,
    ]);

    if (reg) {
      swRegistrationRef = reg;
      // No esperar a que esté ready para no demorar
      navigator.serviceWorker.ready.catch(() => {});
    }
    return reg;
  } catch {
    return null;
  }
};

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

    // Intentar registrar el SW (no crítico si falla)
    const swRegistration = await registerServiceWorker();

    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      console.warn("[FCM] VITE_FIREBASE_VAPID_KEY no configurada");
    }

    const token = await getToken(instance, {
      vapidKey: vapidKey || undefined,
      serviceWorkerRegistration: swRegistration || undefined,
    });

    if (token) {
      await registerTokenOnServer(token);
    }

    return token;
  } catch (err) {
    console.warn("[FCM] No se pudieron activar notificaciones push:", err);
    return null;
  }
};

const registerTokenOnServer = async (token: string): Promise<void> => {
  try {
    // Se registra con el person_id del sistema (no el uid de Firebase Auth):
    // las notificaciones se despachan por person_id (sender/recipient de mensajes),
    // así que el backend necesita esa correlación para poder enviar el push.
    const personId = getAuthUserId();
    if (!personId) return;

    await httpClient.post(`${API_URL}/api/notifications/fcm/register`, {
      personId,
      fcmToken: token,
    });
  } catch (err) {
    console.error("[FCM] Error al registrar token en servidor:", err);
  }
};

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

export const initForegroundListener = (): (() => void) => {
  return onForegroundMessage(({ title, body, data }) => {
    if (Notification.permission !== "granted") return;

    const isUrgent = data?.is_urgent === "true";
    new Notification(title ?? (isUrgent ? "Alerta urgente" : "Nuevo mensaje"), {
      body: body ?? "",
      icon: "/favicon.ico",
      tag: isUrgent ? "urgent-alert" : "normal-message",
      silent: !isUrgent,
    });
  });
};
