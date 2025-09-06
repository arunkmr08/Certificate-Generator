/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_VERIFY_BASE_URL?: string;
  readonly VITE_PUBLISH_ENDPOINT?: string;
  readonly VITE_PUBLISH_API_KEY?: string;
  readonly VITE_PUBLISH_ON_PDF?: string; // '1' to auto-publish when PDF downloaded
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
