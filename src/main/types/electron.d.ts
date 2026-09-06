import { App } from 'electron';

declare module 'electron' {
  interface App {
    isQuiting: boolean;
  }
}