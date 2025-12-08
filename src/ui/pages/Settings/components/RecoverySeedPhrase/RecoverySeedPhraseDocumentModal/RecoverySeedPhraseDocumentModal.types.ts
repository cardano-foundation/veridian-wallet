interface RecoverySeedPhraseDocumentModalProps {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
}

interface DocumentSectionProps {
  sectionKey: string;
  image?: string;
}

interface Content {
  text: string;
}

export type {
  RecoverySeedPhraseDocumentModalProps,
  DocumentSectionProps,
  Content,
};
