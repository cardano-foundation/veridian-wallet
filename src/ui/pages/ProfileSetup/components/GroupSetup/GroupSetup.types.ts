import { SetupProfileStep } from "../../ProfileSetup.types";

interface SetupGroupProps {
  onChangeGroupName: (groupName: string) => void;
  groupName: string;
  onClickEvent: () => void;
  setupProfileStep: SetupProfileStep;
  errorMessage?: string;
}

export type { SetupGroupProps };
