/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WEATHER_API_KEY: string;
  readonly VITE_WEATHER_API_BASE: string;
  readonly VITE_MAP_API_KEY: string;
  readonly VITE_WECOM_WEBHOOK_URL: string;
  readonly VITE_SMS_API_KEY: string;
  readonly VITE_SMS_API_SECRET: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
