import { useState } from "react";
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
};

const SetupGroupProfile = () => {
  const [state, setState] = useState<GroupInfomation>(initialState);

  const CurrentStage = stages[state.stage];

  return (
    <CurrentStage
      state={state}
      setState={setState}
    />
  );
};

export { SetupGroupProfile };
