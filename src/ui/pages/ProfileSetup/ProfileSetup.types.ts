enum SetupProfileStep {
  SetupType = "profiletype",
  SetupProfile = "profilesetup",
  GroupSetupStart = "groupsetupstart",
  GroupSetupConfirm = "groupsetupconfirm",
  FinishSetup = "finishsetup",
}

interface ProfileSetupProps {
  onClose?: (cancel?: boolean) => void;
  joinGroupMode?: boolean;
}

export type { ProfileSetupProps };
export { SetupProfileStep };
