import { ConnectionData } from "../../../store/reducers/profileCache";

interface ConnectdAppProps {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
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

export type { ActionInfo, ConnectdAppProps, ConnectionData };
