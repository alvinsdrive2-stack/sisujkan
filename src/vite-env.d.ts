/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_VALIDATED_NAVIGATION?: string
  readonly VITE_GOOGLE_CLIENT_ID?: string
  readonly VITE_GOOGLE_DRIVE_FOLDER_ID?: string
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
