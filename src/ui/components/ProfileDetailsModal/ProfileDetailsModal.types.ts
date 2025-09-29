import { HardwareBackButtonConfig } from "../PageHeader/PageHeader.types";

interface ProfileDetailsModalProps {
  pageId: string;
  profileId: string;
  onClose?: (animation?: boolean) => void;
  onConnectionComplete?: () => void;
  hardwareBackButtonConfig?: HardwareBackButtonConfig;
  restrictedOptions?: boolean;
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
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
}

const QR_CODE_TYPES = {
  GUARDIANSHIP: "guardianship",
  SOCIALMEDIA: "socialmedia",
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

export { QR_CODE_TYPES, ERROR_MESSAGES, MODAL_STATES };

export type {
  IdentifierDetailModalProps,
  ProfileDetailsModalProps,
  ProfileDetailsModuleProps,
  ModalState,
};
