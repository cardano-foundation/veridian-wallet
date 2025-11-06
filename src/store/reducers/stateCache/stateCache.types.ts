import { LensFacing } from "@capacitor-mlkit/barcode-scanning";
import { LoginAttempts } from "../../../core/agent/services/auth.types";
import { PeerConnectSigningEvent } from "../../../core/cardano/walletConnect/peerConnection.types";
import { OperationType, ToastMsgType } from "../../../ui/globals/types";
import { DAppConnection } from "../profileCache";
import { MultisigConnectionDetails } from "../../../core/agent/agent.types";

interface PayloadData<T = any> {
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
  currentOperation: OperationType;
  queueIncomingRequest: QueueProps<IncomingRequestProps>;
  cameraDirection?: LensFacing;
  showGenericError?: boolean;
  showNoWitnessAlert?: boolean;
  toastMsgs: ToastStackItem[];
  forceInitApp?: number;
  showLoading?: boolean;
  isSetupProfile?: boolean;
  pendingJoinGroupMetadata: PendingJoinGroupMetadata | null;
}

enum InitializationPhase {
  PHASE_ZERO = "PHASE_ZERO",
  PHASE_ONE = "PHASE_ONE",
  PHASE_TWO = "PHASE_TWO",
}

export { IncomingRequestType, InitializationPhase };

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
