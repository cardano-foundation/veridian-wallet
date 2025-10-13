interface SignerData {
  requiredSigners: number | null;
  recoverySigners: number | null;
}

interface SignerInputProps {
  label: string;
  name: keyof SignerData;
  value: number | null;
  maxValue: number;
  onChange: (name: keyof SignerData, value: number | null) => void;
}

interface SetupSignerModalProps {
  isOpen: boolean;
  connectionsLength: number;
  currentValue: SignerData;
  setOpen: (value: boolean) => void;
  onSubmit: (data: SignerData) => void;
}

export type { SignerData, SetupSignerModalProps, SignerInputProps };
