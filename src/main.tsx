import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import * as Sentry from "@sentry/react";
import "./index.css";
import App from "./App.tsx";
import GlobalErrorBoundary from "./components/common/GlobalErrorBoundary";

// Polyfill/Guard for screen.orientation.lock to prevent errors on unsupported devices
if (typeof window !== 'undefined' && window.screen) {
  const orientation = (window.screen as any).orientation || (window.screen as any).msOrientation || (window.screen as any).mozOrientation;
  if (orientation) {
    if (!orientation.lock) {
      orientation.lock = () => Promise.resolve();
    } else {
      const originalLock = orientation.lock.bind(orientation);
      orientation.lock = (type: any) => {
        try {
          const result = originalLock(type);
          return result instanceof Promise ? result.catch(() => { }) : Promise.resolve();
        } catch (e) {
          return Promise.resolve();
        }
      };
    }
  }
}

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;

if (SENTRY_DSN && SENTRY_DSN !== "https://your-dsn-here.ingest.sentry.io/project-id") {
  Sentry.init({
    dsn: SENTRY_DSN,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}

const rootElement = document.getElementById("root");
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <HelmetProvider>
        <GlobalErrorBoundary>
          <App />
        </GlobalErrorBoundary>
      </HelmetProvider>
    </StrictMode>,
  );
}
