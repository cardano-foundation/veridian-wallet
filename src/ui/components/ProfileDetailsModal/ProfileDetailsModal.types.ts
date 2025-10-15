import { HardwareBackButtonConfig } from "../PageHeader/PageHeader.types";

interface ProfileDetailsModalProps {
  pageId: string;
  profileId: string;
  onClose?: (animation?: boolean) => void;
  onConnectionComplete?: () => void;
  hardwareBackButtonConfig?: HardwareBackButtonConfig;
  restrictedOptions?: boolean;
  showProfiles?: (value: boolean) => void;
  isOpen: boolean;
}

interface ProfileDetailsModuleProps extends ProfileDetailsModalProps {
  setIsOpen: (value: boolean) => void;
  setShowConfirmation: (value: boolean) => void;
  confirmConnection: boolean;
  setConfirmConnection: (value: boolean) => void;
  scannedValue: string;
  onScanFinish: (content: string) => void;
  onConnectionComplete: () => void;
  beforeConnectionComplete?: () => void;
}

interface IdentifierDetailModalProps
  extends Omit<ProfileDetailsModalProps, "navAnimation"> {
  setIsOpen: (value: boolean) => void;
}

const QR_CODE_TYPES = {
  GUARDIANSHIP: "guardianship",
  SOCIALMEDIA: "socialmedia",
  KERIBLOX: "keriblox",
} as const;

const ERROR_MESSAGES = {
  MISSING_TYPE: "Unable to find type",
  UNSUPPORTED_TYPE: "Unsupported type",
  INVALID_QR: "Invalid QR code",
  UNABLE_TO_FETCH_OOBI: "Unable to fetch oobi",
  UNABLE_TO_GET_IDENTIFIER_DETAILS: "Unable to get identifier details",
  UNABLE_TO_DELETE_IDENTIFIER: "Unable to delete identifier",
} as const;

const MODAL_STATES = {
  SCAN: "scan",
  CONFIRMATION: "confirmation",
  DEFAULT: "default",
  ERROR: "error",
  PROFILE: "profile",
} as const;

type ModalState = (typeof MODAL_STATES)[keyof typeof MODAL_STATES];

export { ERROR_MESSAGES, MODAL_STATES, QR_CODE_TYPES };

export type {
  IdentifierDetailModalProps,
  ModalState,
  ProfileDetailsModalProps,
  ProfileDetailsModuleProps,
};
