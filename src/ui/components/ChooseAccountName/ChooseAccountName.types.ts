import { CryptoAccountProps } from "../../pages/Crypto/Crypto.types";

interface ChooseAccountNameProps {
  chooseAccountNameIsOpen: boolean;
  setChooseAccountNameIsOpen: (value: boolean) => void;
  setDefaultAccountData?: (value: CryptoAccountProps) => void;
  seedPhrase?: string;
  onDone?: () => void;
}

export type { ChooseAccountNameProps };
