import { useState } from "react";
import { useLocation } from "react-router-dom";
import { CreationStatus } from "../../../core/agent/agent.types";
import { SetupConnections } from "./components/SetupConnections";
import "./SetupGroupProfile.scss";
import { GroupInfomation, Stage } from "./SetupGroupProfile.types";

const stages = [SetupConnections];

const initialState: GroupInfomation = {
  stage: Stage.SetupConnection,
  displayNameValue: "",
  threshold: 1,
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
    groupInitiator: false,
    groupCreated: false,
    userName: "",
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
      groupMetadata={state.groupMetadata}
    />
  );
};

export { SetupGroupProfile };
