interface ShareProfileProps {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
  oobi: string;
}

enum Tab {
  ShareOobi = "share-oobi",
  Scan = "scan",
}

export { Tab };
export type { ShareProfileProps };
