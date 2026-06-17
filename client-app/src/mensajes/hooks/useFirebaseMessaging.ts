import { useEffect, useState } from "react";
import { getAuthUserId } from "../../config/httpClient";
import { initForegroundListener, requestPushPermission } from "../services/firebaseMessagingService";

/**
 * Hook que solicita permiso para notificaciones push FCM y registra el token.
 *
 * Se basa en la sesión de la app (JWT propio), no en Firebase Auth: el login
 * por email/password no inicia sesión en el SDK de Firebase, así que esperar
 * a `firebaseAuth.onAuthStateChanged` nunca dispara el registro para esos usuarios.
 */
export const useFirebaseMessaging = () => {
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    if (!getAuthUserId()) return;

    let active = true;
    requestPushPermission().then((token) => {
      if (!active || !token) return;
      setFcmToken(token);
      setPermissionGranted(true);
    });

    const unsubscribeForeground = initForegroundListener();

    return () => {
      active = false;
      unsubscribeForeground();
    };
  }, []);

  return { fcmToken, permissionGranted };
};
