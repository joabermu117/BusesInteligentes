let scriptPromise: Promise<void> | null = null;

declare global {
  interface Window {
    grecaptcha?: {
      ready: (callback: () => void) => void;
      execute: (siteKey: string, options: { action: string }) => Promise<string>;
    };
  }
}

const RECAPTCHA_SCRIPT_URL = "https://www.google.com/recaptcha/api.js?render=";

const getSiteKey = (): string => {
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
  if (!siteKey) {
    throw new Error("VITE_RECAPTCHA_SITE_KEY no esta configurado");
  }

  return siteKey;
};

const loadRecaptchaScript = (siteKey: string): Promise<void> => {
  if (scriptPromise) {
    return scriptPromise;
  }

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `${RECAPTCHA_SCRIPT_URL}${siteKey}`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("No fue posible cargar reCAPTCHA"));
    document.head.appendChild(script);
  });

  return scriptPromise;
};

export const executeRecaptcha = async (action: string): Promise<string> => {
  const siteKey = getSiteKey();
  await loadRecaptchaScript(siteKey);

  if (!window.grecaptcha) {
    throw new Error("reCAPTCHA no se inicializo correctamente");
  }

  return new Promise((resolve, reject) => {
    window.grecaptcha?.ready(async () => {
      try {
        const token = await window.grecaptcha?.execute(siteKey, { action });
        if (!token) {
          reject(new Error("reCAPTCHA no devolvio token"));
          return;
        }

        resolve(token);
      } catch (error) {
        reject(error instanceof Error ? error : new Error("No fue posible ejecutar reCAPTCHA"));
      }
    });
  });
};
