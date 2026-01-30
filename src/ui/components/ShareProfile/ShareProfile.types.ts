interface ShareProfileProps {
  isOpen: boolean;
  setIsOpen: (value: boolean, closeModals?: boolean) => void;
  oobi: string;
  hiddenScan?: boolean;
  defaultTab?: Tab;
  onScan?: (
    content: string,
    registerScanHandler?: () => Promise<void>
  ) => Promise<void>;
}

enum Tab {
  ShareOobi = "share-oobi",
  Scan = "scan",
}

export { Tab };
export type { ShareProfileProps };
