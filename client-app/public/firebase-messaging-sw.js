importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyD6YV5wvyZTCWiZnu9YhCc01G8KX8gKJUU",
  authDomain: "buses-inteligentes-970ff.firebaseapp.com",
  projectId: "buses-inteligentes-970ff",
  storageBucket: "buses-inteligentes-970ff.firebasestorage.app",
  messagingSenderId: "118033666257",
  appId: "1:118033666257:web:ab0a94a1fcdc774c8bb5f0",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification?.title || "Notificación";
  const notificationBody = payload.notification?.body || "";
  const notificationIcon = "/favicon.ico";

  self.registration.showNotification(notificationTitle, {
    body: notificationBody,
    icon: notificationIcon,
  });
});
