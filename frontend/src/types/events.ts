export type AppEvent = {
  'app-logout': void;
};

declare global {
  interface WindowEventMap {
    'app-logout': CustomEvent<void>;
  }
}