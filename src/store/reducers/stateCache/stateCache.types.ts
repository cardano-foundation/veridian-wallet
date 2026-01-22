import { LensFacing } from "@capacitor-mlkit/barcode-scanning";
import { MultisigConnectionDetails } from "../../../core/agent/agent.types";
import { LoginAttempts } from "../../../core/agent/services/auth.types";
import { PeerConnectSigningEvent } from "../../../core/cardano/walletConnect/peerConnection.types";
import { ToastMsgType } from "../../../ui/globals/types";
import { DAppConnection } from "../profileCache";

interface PayloadData<T = unknown> {
  [key: string]: T;
}

interface CurrentRouteCacheProps {
  path: string;
  payload?: { [key: string]: PayloadData };
}

interface AuthenticationCacheProps {
  loggedIn: boolean;
  time: number;
  passcodeIsSet: boolean;
  seedPhraseIsSet: boolean;
  passwordIsSet: boolean;
  passwordIsSkipped: boolean;
  ssiAgentIsSet: boolean;
  ssiAgentUrl: string;
  recoveryWalletProgress: boolean;
  loginAttempt: LoginAttempts;
  firstAppLaunch: boolean;
  finishSetupBiometrics?: boolean;
}

enum IncomingRequestType {
  PEER_CONNECT_SIGN = "peer-connect-sign",
}

type PeerConnectSigningEventRequest = {
  type: IncomingRequestType.PEER_CONNECT_SIGN;
  signTransaction: PeerConnectSigningEvent;
  peerConnection: DAppConnection;
};

type IncomingRequestProps = PeerConnectSigningEventRequest;

interface QueueProps<T> {
  isPaused: boolean;
  isProcessing: boolean;
  queues: T[];
}

interface ToastStackItem {
  id: string;
  message: ToastMsgType;
}

interface PendingJoinGroupMetadata {
  isPendingJoinGroup: boolean;
  groupId: string;
  groupName: string;
  initiatorName: string | null;
  connection: MultisigConnectionDetails;
}

interface StateCacheProps {
  initializationPhase: InitializationPhase;
  recoveryCompleteNoInterruption: boolean;
  isOnline: boolean;
  routes: CurrentRouteCacheProps[];
  authentication: AuthenticationCacheProps;
  queueIncomingRequest: QueueProps<IncomingRequestProps>;
  cameraDirection?: LensFacing;
  showGenericError?: boolean;
  showNoWitnessAlert?: boolean;
  toastMsgs: ToastStackItem[];
  forceInitApp?: number;
  showLoading: GlobalLoadingType;
  isSetupProfile?: boolean;
  pendingJoinGroupMetadata: PendingJoinGroupMetadata | null;
  showVerifySeedPhraseAlert?: boolean;
  isSyncingData?: boolean;
  isShowSeedPhraseScreen?: boolean;
  isInBiometricProcess?: boolean;
}

enum InitializationPhase {
  PHASE_ZERO = "PHASE_ZERO",
  PHASE_ONE = "PHASE_ONE",
  PHASE_TWO = "PHASE_TWO",
}

enum GlobalLoadingType {
  NONE = "NONE",
  HIDEBG = "HIDE_BG",
  SHOWBG = "SHOW_BG",
}

export { IncomingRequestType, InitializationPhase, GlobalLoadingType };

export type {
  AuthenticationCacheProps,
  CurrentRouteCacheProps,
  IncomingRequestProps,
  PayloadData,
  PeerConnectSigningEventRequest,
  PendingJoinGroupMetadata,
  QueueProps,
  StateCacheProps,
  ToastStackItem,
};
