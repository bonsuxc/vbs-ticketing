/// <reference types="vite/client" />

// For React JSX
declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: any;
  }
}

// For environment variables
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// For CSS modules
declare module '*.module.css' {
  const classes: { [key: string]: string };
  export default classes;
}

// For image imports
declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.gif';
declare module '*.svg';
