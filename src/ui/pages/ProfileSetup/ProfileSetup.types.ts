enum SetupProfileStep {
  SetupType = "profiletype",
  SetupProfile = "profilesetup",
  FinishSetup = "finishsetup",
}

interface ProfileSetupProps {
  onClose?: (cancel?: boolean) => void;
}

export type { ProfileSetupProps };
export { SetupProfileStep };
