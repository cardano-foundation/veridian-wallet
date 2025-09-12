interface SignerData {
  requiredSigners: number;
  recoverySigners: number;
}

interface SignerInputProps {
  label: string;
  name: keyof SignerData;
  value: number;
  maxValue: number;
  onChange: (name: keyof SignerData, value: number) => void;
}

interface SetupSignerModalProps {
  isOpen: boolean;
  connectionsLength: number;
  currentValue: SignerData;
  setOpen: (value: boolean) => void;
  onSubmit: (data: SignerData) => void;
}

export type { SignerData, SetupSignerModalProps, SignerInputProps };
