import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { CreationStatus } from "../../../core/agent/agent.types";
import { useAppSelector } from "../../../store/hooks";
import { getCurrentProfile } from "../../../store/reducers/profileCache";
import { InitializeGroup } from "./components/InitializeGroup/InitializeGroup";
import { SetupConnections } from "./components/SetupConnections";
import "./SetupGroupProfile.scss";
import { GroupInfomation, Stage } from "./SetupGroupProfile.types";
import { PendingGroup } from "./components/PendingGroup/PendingGroup";

const stages = [SetupConnections, InitializeGroup, PendingGroup];

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
  const currentProfile = useAppSelector(getCurrentProfile);
  const groupName = queryParams.get("groupName");
  const [state, setState] = useState<GroupInfomation>({
    ...initialState,
    stage:
      currentProfile?.identity.creationStatus === CreationStatus.PENDING
        ? Stage.Pending
        : Stage.SetupConnection,
  });
  const CurrentStage = stages[state.stage];

  useEffect(() => {
    if (!currentProfile) return;

    setState({
      stage:
        currentProfile.identity.creationStatus === CreationStatus.PENDING
          ? Stage.Pending
          : Stage.SetupConnection,
      displayNameValue: currentProfile.identity.displayName,
      signer: {
        requiredSigners: 0,
        recoverySigners: 0,
      },
      scannedConections: currentProfile.multisigConnections,
      selectedConnections: currentProfile.multisigConnections,
      ourIdentifier: currentProfile.identity.id,
      newIdentifier: currentProfile.identity,
      groupMetadata: currentProfile.identity.groupMetadata,
    });
  }, [currentProfile]);

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
