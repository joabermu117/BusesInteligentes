import { useEffect, useState } from "react";
import { firebaseAuth } from "../../config/firebase";
import { initForegroundListener, requestPushPermission } from "../services/firebaseMessagingService";

/**
 * Hook que solicita permiso para notificaciones push FCM
 * y registra el token cuando el usuario está autenticado.
 */
export const useFirebaseMessaging = () => {
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    const init = async () => {
      // Solo inicializar si hay un usuario autenticado con Firebase
      const unsubscribeAuth = firebaseAuth.onAuthStateChanged(async (user) => {
        if (user) {
          // Solicitar permiso y registrar token
          const token = await requestPushPermission();
          if (token) {
            setFcmToken(token);
            setPermissionGranted(true);
          }
        }
      });

      // Iniciar listener para mensajes en foreground
      const unsubscribeForeground = initForegroundListener();

      return () => {
        unsubscribeAuth();
        unsubscribeForeground();
      };
    };

    init();
  }, []);

  return { fcmToken, permissionGranted };
};
