interface ChangePinProps {
  changePinStep: number;
  setChangePinStep: (step: number) => void;
  handleClose: () => void;
}

interface ChangePinModuleRef {
  clearState: () => void;
}

export type { ChangePinProps, ChangePinModuleRef };
