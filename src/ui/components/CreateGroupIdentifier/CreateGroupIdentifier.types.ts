import { Dispatch, SetStateAction } from "react";
import { ConnectionShortDetails } from "../../../core/agent/agent.types";
import { IdentifierShortDetails } from "../../../core/agent/services/identifier.types";
import { IdentifierColor } from "../EditProfile/components/IdentifierColorSelector";
import { MultiSigGroup } from "../../../store/reducers/profileCache";

enum Stage {
  SetupConnection,
  Members,
  SetupThreshold,
  Summary,
}

interface CreateIdentifierProps {
  modalIsOpen: boolean;
  setModalIsOpen: (value: boolean) => void;
  resumeMultiSig?: IdentifierShortDetails | null;
  setResumeMultiSig?: (value: IdentifierShortDetails | null) => void;
  groupId?: string;
  preventRedirect?: boolean;
  openAfterCreate?: boolean;
}

interface IdentifierStageStateProps {
  identifierCreationStage: number;
  displayNameValue: string;
  selectedAidType: number;
  selectedTheme: number;
  threshold: number;
  scannedConections: ConnectionShortDetails[];
  selectedConnections: ConnectionShortDetails[];
  newIdentifier: IdentifierShortDetails;
  ourIdentifier: string;
  color: IdentifierColor;
}

interface IdentifierStageProps {
  state: IdentifierStageStateProps;
  setState: Dispatch<SetStateAction<IdentifierStageStateProps>>;
  componentId: string;
  setBlur?: (value: boolean) => void;
  resetModal: () => void;
  resumeMultiSig?: IdentifierShortDetails | null;
  multiSigGroup?: MultiSigGroup;
  setMultiSigGroup?: (value: MultiSigGroup) => void;
  preventRedirect?: boolean;
  isModalOpen?: boolean;
  openAfterCreate?: boolean;
}

interface IdentifierStage1BodyProps {
  componentId: string;
  handleDone: () => void;
  handleInitiateMultiSig?: () => void;
  oobi: string;
  identifierId: string;
  groupMetadata?: {
    groupId: string;
    groupInitiator: boolean;
    groupCreated: boolean;
  };
  scannedConections?: ConnectionShortDetails[];
  handleScanButton: () => void;
  handleDelete?: () => void;
}

export { Stage };

export type {
  CreateIdentifierProps,
  IdentifierStageStateProps,
  IdentifierStageProps,
  IdentifierStage1BodyProps,
};
