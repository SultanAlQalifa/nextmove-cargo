// Ce fichier doit intercepter TOUTES les erreurs et warnings
const PRODUCTION = import.meta.env.PROD;

export const logger = {
  error: (...args: any[]) => {
    if (!PRODUCTION) {
      console.error("[ERROR]", ...args);
    }
    // Optionnel : Envoyer à un service de monitoring (Sentry, etc.)
  },

  warn: (...args: any[]) => {
    if (!PRODUCTION) {
      console.warn("[WARNING]", ...args);
    }
  },

  info: (...args: any[]) => {
    if (!PRODUCTION) {
      console.log("[INFO]", ...args);
    }
  },

  debug: (...args: any[]) => {
    if (!PRODUCTION) {
      console.log("[DEBUG]", ...args);
    }
  },
};

// Capturer toutes les erreurs non gérées
window.addEventListener("error", (event) => {
  logger.error("Uncaught error:", event.error);
});

window.addEventListener("unhandledrejection", (event) => {
  logger.error("Unhandled promise rejection:", event.reason);
});
