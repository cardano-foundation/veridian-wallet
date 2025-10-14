import { useEffect, useMemo, useState } from "react";
import { CreationStatus } from "../../../core/agent/agent.types";
import { NotificationRoute } from "../../../core/agent/services/keriaNotificationService.types";
import { TabsRoutePath } from "../../../routes/paths";
import { useAppSelector } from "../../../store/hooks";
import { getCurrentProfile } from "../../../store/reducers/profileCache";
import { useAppIonRouter } from "../../hooks";
import { InitializeGroup } from "./components/InitializeGroup/InitializeGroup";
import { PendingGroup } from "./components/PendingGroup/PendingGroup";
import { SetupConnections } from "./components/SetupConnections";
import "./SetupGroupProfile.scss";
import { GroupInfomation, Stage } from "./SetupGroupProfile.types";

const stages = [SetupConnections, InitializeGroup, PendingGroup];

const initialState: GroupInfomation = {
  stage: Stage.SetupConnection,
  displayNameValue: "",
  signer: {
    requiredSigners: null,
    recoverySigners: null,
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
  const currentProfile = useAppSelector(getCurrentProfile);
  const identity = currentProfile?.identity;
  const router = useAppIonRouter();

  const isPendingState = useMemo(() => {
    if (!currentProfile) return false;

    const isInitiatorPending =
      currentProfile?.identity.creationStatus === CreationStatus.PENDING &&
      currentProfile.multisigConnections.length > 0 &&
      currentProfile.identity.groupMetadata?.groupInitiator;

    const existInitGroup = currentProfile.notifications.some(
      (item) => item.a.r === NotificationRoute.MultiSigIcp
    );

    const isMemberPending =
      existInitGroup ||
      (!existInitGroup &&
        !currentProfile.identity.groupMetadata?.groupInitiator &&
        currentProfile?.identity.creationStatus === CreationStatus.PENDING &&
        currentProfile.identity.groupMemberPre);

    return isInitiatorPending || isMemberPending;
  }, [currentProfile]);

  const [state, setState] = useState<GroupInfomation>({
    ...initialState,
    stage: isPendingState ? Stage.Pending : Stage.SetupConnection,
  });
  const CurrentStage = stages[state.stage];

  useEffect(() => {
    if (
      identity?.creationStatus === CreationStatus.COMPLETE &&
      !!identity?.groupMemberPre
    ) {
      router.push(TabsRoutePath.CREDENTIALS, "root", "replace");
    }
  }, [identity?.creationStatus, identity?.groupMemberPre, router]);

  useEffect(() => {
    if (!currentProfile) return;

    setState({
      stage: isPendingState ? Stage.Pending : Stage.SetupConnection,
      displayNameValue: currentProfile.identity.displayName,
      signer: {
        requiredSigners: null,
        recoverySigners: null,
      },
      scannedConections: currentProfile.multisigConnections,
      selectedConnections: currentProfile.multisigConnections,
      ourIdentifier: currentProfile.identity.id,
      newIdentifier: currentProfile.identity,
      groupMetadata: currentProfile.identity.groupMetadata,
    });
  }, [currentProfile, isPendingState]);

  return (
    <CurrentStage
      state={state}
      setState={setState}
      isPendingGroup={!!isPendingState}
    />
  );
};

export { SetupGroupProfile };
