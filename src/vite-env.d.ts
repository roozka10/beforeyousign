/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OPENROUTER_API_KEY: string;
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  readonly VITE_SOVRN_PUBLISHER_KEY?: string;
  readonly VITE_AMAZON_ASSOCIATE_TAG?: string;
  readonly VITE_AFFILIATE_LEGALZOOM_URL?: string;
  readonly VITE_AFFILIATE_ROCKETLAWYER_URL?: string;
  readonly VITE_AFFILIATE_DOCUSIGN_URL?: string;
  readonly VITE_AFFILIATE_PRIVACY_URL?: string;
  readonly VITE_AFFILIATE_AMAZON_BOOK_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
