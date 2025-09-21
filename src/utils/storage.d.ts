declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.gif';
declare module '*.svg';

declare module './storage' {
  export const uploadImage: (file: File) => Promise<string | null>;
}
