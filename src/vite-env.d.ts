/// <reference types="react" />
/// <reference types="react-dom" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY: string
  readonly VITE_FIREBASE_AUTH_DOMAIN: string
  readonly VITE_FIREBASE_PROJECT_ID: string
  readonly VITE_FIREBASE_STORAGE_BUCKET: string
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string
  readonly VITE_FIREBASE_APP_ID: string
  readonly VITE_EDITOR_EMAIL_1: string
  readonly VITE_EDITOR_EMAIL_2: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module 'framer-motion' {
  export const motion: any
}

declare module 'react-markdown' {
  const ReactMarkdown: any
  export default ReactMarkdown
}

declare module 'remark-gfm' {
  const remarkGfm: any
  export default remarkGfm
}

declare module 'lucide-react' {
  export const Heart: any
  export const LockKeyhole: any
  export const Sparkles: any
  export const Upload: any
  export const Music4: any
  export const ImagePlus: any
  export const PenSquare: any
}