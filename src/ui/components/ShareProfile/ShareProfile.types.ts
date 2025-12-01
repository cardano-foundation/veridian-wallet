interface ShareProfileProps {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
}

enum Tab {
  ShareOobi = "share-oobi",
  Scan = "scan",
}

export { Tab };
export type { ShareProfileProps };
