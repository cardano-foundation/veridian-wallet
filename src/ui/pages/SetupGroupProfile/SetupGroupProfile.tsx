import { useState } from "react";
import { useLocation } from "react-router-dom";
import { CreationStatus } from "../../../core/agent/agent.types";
import { SetupConnections } from "./components/SetupConnections";
import "./SetupGroupProfile.scss";
import { GroupInfomation, Stage } from "./SetupGroupProfile.types";
import { InitializeGroup } from "./components/InitializeGroup/InitializeGroup";

const stages = [SetupConnections, InitializeGroup];

const initialState: GroupInfomation = {
  stage: Stage.SetupConnection,
  displayNameValue: "",
  signer: {
    requiredSigners: 0,
    recoverySigners: 0,
  },
  scannedConections: [],
  selectedConnections: [],
  ourIdentifier: "",
  newIdentifier: {
    id: "",
    displayName: "",
    createdAtUTC: "",
    theme: 0,
    creationStatus: CreationStatus.COMPLETE,
  },
  groupMetadata: {
    groupId: "",
    groupInitiator: false, // Default to false for joiners
    groupCreated: false,
    userName: "",
    initiatorName: "",
  },
};

const SetupGroupProfile = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const groupName = queryParams.get("groupName");
  const [state, setState] = useState<GroupInfomation>(initialState);
  const CurrentStage = stages[state.stage];

  return (
    <CurrentStage
      state={state}
      setState={setState}
      groupName={groupName}
      groupMetadata={{
        ...state.groupMetadata,
        groupId: state.groupMetadata?.groupId ?? "",
        groupInitiator: state.groupMetadata?.groupInitiator ?? false,
        groupCreated: state.groupMetadata?.groupCreated ?? false,
        userName: state.groupMetadata?.userName ?? "",
        initiatorName: state.groupMetadata?.initiatorName ?? "",
      }}
    />
  );
};

export { SetupGroupProfile };
