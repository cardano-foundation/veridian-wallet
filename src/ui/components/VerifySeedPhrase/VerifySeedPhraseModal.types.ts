interface VerifySeedPhraseModalProps {
  show: boolean;
  setShow: (value: boolean) => void;
  onVerifySuccess: () => void;
  showCancel?: boolean;
}

interface VerifyStageProps {
  seedPhrase: string[];
  onVerifySuccess: () => void;
  handleClose: () => void;
  pageId: string;
}

enum Step {
  View,
  Verify,
}

export type { VerifySeedPhraseModalProps, VerifyStageProps };
export { Step };
