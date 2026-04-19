// src/instrument.js
import * as Sentry from "@sentry/node";

const SENTRY_DSN = process.env.SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    integrations: [
      Sentry.expressIntegration(),
    ],
    tracesSampleRate: 1.0,
    environment: process.env.NODE_ENV || 'development',
  });
  
  const maskedDsn = SENTRY_DSN.substring(0, 15) + "..." + SENTRY_DSN.substring(SENTRY_DSN.length - 5);
  console.log(`✅ Sentry inicializado con DSN: ${maskedDsn}`);
} else {
  console.log("⚠️ Sentry no inicializado: SENTRY_DSN no configurado");
}
