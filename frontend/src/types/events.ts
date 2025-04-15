export type AppEvent = {
  'app-logout': void;
};

interface ImportSuccessEventDetail {
  count: number;
}

export interface WordImportSuccessEvent extends CustomEvent<{ count: number }> {
    type: 'wordImportSuccess';
}

export interface FlashcardShareSuccessEvent extends CustomEvent<{ count: number }> {
    type: 'flashcardShareSuccess';
}

declare global {
  interface WindowEventMap {
    'app-logout': CustomEvent<void>;
    'wordImportSuccess': CustomEvent<ImportSuccessEventDetail>;
    wordImportSuccess: WordImportSuccessEvent;
    flashcardShareSuccess: FlashcardShareSuccessEvent;
  }
}

export {};