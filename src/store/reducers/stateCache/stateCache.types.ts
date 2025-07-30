import { LensFacing } from "@capacitor-mlkit/barcode-scanning";
import { LoginAttempts } from "../../../core/agent/services/auth.types";
import {
  PeerConnection,
  PeerConnectSigningEvent,
} from "../../../core/cardano/walletConnect/peerConnection.types";
import { OperationType, ToastMsgType } from "../../../ui/globals/types";
import { ConnectionData } from "../walletConnectionsCache";
import { IdentifierShortDetails } from "../../../core/agent/services/identifier.types";
import { ConnectionShortDetails } from "../../../core/agent/agent.types";
import { CredentialShortDetails } from "../../../core/agent/services/credentialService.types";
import { KeriaNotification } from "../../../core/agent/services/keriaNotificationService.types";

interface PayloadData<T = any> {
  [key: string]: T;
}

interface CurrentRouteCacheProps {
  path: string;
  payload?: { [key: string]: PayloadData };
}

interface AuthenticationCacheProps {
  loggedIn: boolean;
  userName: string;
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
  peerConnection: ConnectionData;
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

interface CurrentProfileProps {
  identity: IdentifierShortDetails;
  connections: ConnectionShortDetails[];
  multisigConnections: ConnectionShortDetails[];
  peerConnections: ConnectionData[];
  credentials: CredentialShortDetails[];
  archivedCredentials: CredentialShortDetails[];
  notifications: KeriaNotification[];
}

interface StateCacheProps {
  initializationPhase: InitializationPhase;
  recoveryCompleteNoInterruption: boolean;
  isOnline: boolean;
  routes: CurrentRouteCacheProps[];
  currentProfile: CurrentProfileProps;
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
  profileHistories: string[];
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
  QueueProps,
  StateCacheProps,
  ToastStackItem,
};
