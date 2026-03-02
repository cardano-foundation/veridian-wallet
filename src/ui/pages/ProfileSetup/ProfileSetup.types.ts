enum SetupProfileStep {
  SetupType = "profiletype",
  SetupProfile = "profilesetup",
  GroupSetupStart = "groupsetupstart",
  GroupSetupConfirm = "groupsetupconfirm",
  FinishSetup = "finishsetup",
}

interface ProfileSetupProps {
  onClose?: (cancel?: boolean, onFinish?: () => void) => void;
  joinGroupMode?: boolean;
  displayOnModal?: boolean;
}

export type { ProfileSetupProps };
export { SetupProfileStep };
