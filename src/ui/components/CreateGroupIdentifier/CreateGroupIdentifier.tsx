import { IonModal } from "@ionic/react";
import { useCallback, useEffect, useState } from "react";
import { Agent } from "../../../core/agent/agent";
import { useAppDispatch } from "../../../store/hooks";
import { setMultiSigGroupCache } from "../../../store/reducers/identifiersCache";
import { MultiSigGroup } from "../../../store/reducers/identifiersCache/identifiersCache.types";
import { useOnlineStatusEffect } from "../../hooks";
import { showError } from "../../utils/error";
import { IdentifierColor } from "../EditProfile/components/IdentifierColorSelector";
import { Spinner } from "../Spinner";
import "./CreateGroupIdentifier.scss";
import {
  CreateIdentifierProps,
  IdentifierStageStateProps,
} from "./CreateGroupIdentifier.types";
import { GroupMembers } from "./components/GroupMembers";
import { SetupConnections } from "./components/SetupConnections";
import { SetupThreshold } from "./components/SetupThreshold";
import { Summary } from "./components/Summary";
import { CreationStatus } from "../../../core/agent/agent.types";

const stages = [SetupConnections, GroupMembers, SetupThreshold, Summary];

const initialState: IdentifierStageStateProps = {
  identifierCreationStage: 0,
  displayNameValue: "",
  selectedAidType: 0,
  selectedTheme: 0,
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
  color: IdentifierColor.One,
};

const CreateGroupIdentifier = ({
  modalIsOpen,
  setModalIsOpen,
  resumeMultiSig,
  setResumeMultiSig,
  groupId: groupIdProp,
  preventRedirect,
  openAfterCreate,
}: CreateIdentifierProps) => {
  const componentId = "create-group-identifier-modal";
  const dispatch = useAppDispatch();
  const [state, setState] = useState<IdentifierStageStateProps>(initialState);
  const [blur, setBlur] = useState(false);
  const groupId = groupIdProp || resumeMultiSig?.groupMetadata?.groupId;
  const [multiSigGroup, setMultiSigGroup] = useState<
    MultiSigGroup | undefined
  >();

  useEffect(() => {
    if (blur) {
      document?.querySelector("ion-router-outlet")?.classList.add("blur");
    } else {
      document?.querySelector("ion-router-outlet")?.classList.remove("blur");
    }
  }, [blur]);

  const updateMultiSigGroup = useCallback(async () => {
    try {
      if (!groupId) return;

      const connections =
        await Agent.agent.connections.getMultisigLinkedContacts(groupId);
      const multiSigGroup: MultiSigGroup = {
        groupId,
        connections,
      };
      setMultiSigGroup(multiSigGroup);
      dispatch(setMultiSigGroupCache(multiSigGroup));
    } catch (e) {
      showError("Unable to update multisig", e, dispatch);
    }
  }, [dispatch, groupId]);

  useOnlineStatusEffect(updateMultiSigGroup);

  const resetModal = () => {
    setBlur(false);
    setModalIsOpen(false);
    setState(initialState);
    setResumeMultiSig && setResumeMultiSig(null);
    setMultiSigGroup && setMultiSigGroup(undefined);
    dispatch(setMultiSigGroupCache(undefined));
  };

  const CurrentStage = stages[state.identifierCreationStage];

  return (
    <IonModal
      isOpen={modalIsOpen}
      className={`${componentId} full-page-modal ${blur ? "blur" : ""}`}
      data-testid={componentId}
    >
      <Spinner show={blur} />
      {modalIsOpen && CurrentStage && (
        <CurrentStage
          state={state}
          setState={setState}
          componentId={componentId}
          resetModal={resetModal}
          setBlur={setBlur}
          resumeMultiSig={resumeMultiSig}
          multiSigGroup={multiSigGroup}
          setMultiSigGroup={setMultiSigGroup}
          preventRedirect={preventRedirect}
          isModalOpen={modalIsOpen}
          openAfterCreate={openAfterCreate}
        />
      )}
    </IonModal>
  );
};

export { CreateGroupIdentifier };
