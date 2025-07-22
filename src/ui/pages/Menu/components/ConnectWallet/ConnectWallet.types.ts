import { ConnectionData } from "../../../../../store/reducers/walletConnectionsCache";

interface ConnectdApp {
  openConnectWallet: () => void;
}

type ActionInfo = {
  type: ActionType;
  data?: ConnectionData;
};

enum ActionType {
  Add = "add",
  Delete = "delete",
  Connect = "connect",
  None = "none",
}

export { ActionType };

export type { ConnectdApp, ActionInfo, ConnectionData };
