export type AppEvent = {
  'app-logout': void;
};

interface ImportSuccessEventDetail {
  count: number;
}

interface CatalogCreatedEventDetail {
  message: string;
}

export interface WordImportSuccessEvent extends CustomEvent<ImportSuccessEventDetail> {
  type: 'wordImportSuccess';
}

export interface FlashcardShareSuccessEvent extends CustomEvent<ImportSuccessEventDetail> {
  type: 'flashcardShareSuccess';
}

export interface CatalogCreatedEvent extends CustomEvent<CatalogCreatedEventDetail> {
  type: 'catalogCreated';
}

declare global {
  interface WindowEventMap {
    'app-logout': CustomEvent<void>;
    'wordImportSuccess': WordImportSuccessEvent;
    'flashcardShareSuccess': FlashcardShareSuccessEvent;
    'catalogCreated': CatalogCreatedEvent;
  }
}

export {};