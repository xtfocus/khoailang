export type AppEvent = {
  'app-logout': void;
};

interface ImportSuccessEventDetail {
  count: number;
}

declare global {
  interface WindowEventMap {
    'app-logout': CustomEvent<void>;
    'wordImportSuccess': CustomEvent<ImportSuccessEventDetail>;
  }
}

export {};