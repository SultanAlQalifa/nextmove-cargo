import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import * as Sentry from "@sentry/react";
import "./index.css";
import App from "./App.tsx";
import GlobalErrorBoundary from "./components/common/GlobalErrorBoundary";

// Polyfill/Guard for screen.orientation.lock
if (typeof window !== 'undefined' && window.screen && window.screen.orientation && !window.screen.orientation.lock) {
  // @ts-ignore
  window.screen.orientation.lock = () => Promise.resolve();
} else if (typeof window !== 'undefined' && window.screen && window.screen.orientation && window.screen.orientation.lock) {
  const originalLock = window.screen.orientation.lock.bind(window.screen.orientation);
  window.screen.orientation.lock = (orientation: OrientationLockType) => {
    try {
      return originalLock(orientation).catch(() => { });
    } catch (e) {
      return Promise.resolve();
    }
  };
}

// Polyfill/Guard for screen.orientation.lock
if (typeof window !== 'undefined' && window.screen && (window.screen as any).orientation && !(window.screen as any).orientation.lock) {
  (window.screen as any).orientation.lock = () => Promise.resolve();
} else if (typeof window !== 'undefined' && window.screen && (window.screen as any).orientation && (window.screen as any).orientation.lock) {
  const originalLock = (window.screen as any).orientation.lock.bind((window.screen as any).orientation);
  (window.screen as any).orientation.lock = (orientation: any) => {
    try {
      const result = originalLock(orientation);
      return result instanceof Promise ? result.catch(() => {
        // Silently fail if orientation lock is not supported or fails
      }) : Promise.resolve();
    } catch (e) {
      return Promise.resolve();
    }
  };
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
