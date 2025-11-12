import { IonButton, IonIcon } from "@ionic/react";
import { useLogger } from "../../../../context/LoggerContext";
import { pencilOutline, star, warningOutline } from "ionicons/icons";
import { useMemo, useState } from "react";
import { useHistory } from "react-router-dom";
import { Agent } from "../../../../../core/agent/agent";
import {
  ConnectionShortDetails,
  MultisigConnectionDetails,
} from "../../../../../core/agent/agent.types";
import { i18n } from "../../../../../i18n";
import { RoutePath } from "../../../../../routes";
import { useAppDispatch, useAppSelector } from "../../../../../store/hooks";
import { getCurrentProfile } from "../../../../../store/reducers/profileCache";
import { setToastMsg } from "../../../../../store/reducers/stateCache";
import { Alert } from "../../../../components/Alert";
import { MemberAvatar } from "../../../../components/Avatar";
import {
  CardBlock,
  CardDetailsContent,
  FlatBorderType,
} from "../../../../components/CardDetails";
import { ScrollablePageLayout } from "../../../../components/layout/ScrollablePageLayout";
import { MemberList } from "../../../../components/MemberList";
import {
  Member,
  MemberAcceptStatus,
} from "../../../../components/MemberList/MemberList.type";
import { PageFooter } from "../../../../components/PageFooter";
import { PageHeader } from "../../../../components/PageHeader";
import { Spinner } from "../../../../components/Spinner";
import { SpinnerConverage } from "../../../../components/Spinner/Spinner.type";
import { ToastMsgType } from "../../../../globals/types";
import { showError } from "../../../../utils/error";
import { Stage, StageProps } from "../../SetupGroupProfile.types";
import { SetupMemberModal } from "../SetupMemberModal/SetupMemberModal";
import { SetupSignerModal } from "../SetupSignerModal";
import { SignerData } from "../SetupSignerModal/SetupSignerModal.types";
import "./InitializeGroup.scss";

const InitializeGroup = ({ state, setState }: StageProps) => {
  const dispatch = useAppDispatch();
  const componentId = "init-group";
  const [openCancelAlert, setOpenCancelAlert] = useState(false);
  const [openSigners, setOpenSigners] = useState(false);
  const [openEditMembers, setOpenEditMembers] = useState(false);
  const [loading, setLoading] = useState(false);
  const history = useHistory();
  const logger = useLogger();

  const profile = useAppSelector(getCurrentProfile);

  const openCloseAlert = () => setOpenCancelAlert(true);

  const handleClose = () => {
    setState((state) => ({ ...state, stage: Stage.SetupConnection }));
  };

  const members = useMemo(() => {
    const members = state.selectedConnections?.map((member): Member => {
      const name = member?.label || "";

      return {
        name,
        isCurrentUser: false,
        status: MemberAcceptStatus.None,
      };
    });

    members.unshift({
      name: profile?.identity.groupMetadata?.proposedUsername || "",
      isCurrentUser: true,
      status: MemberAcceptStatus.None,
    });

    return members.map((member, index) => ({
      ...member,
      avatar: (
        <MemberAvatar
          firstLetter={member.name.at(0)?.toLocaleUpperCase() || ""}
          rank={index >= 0 ? index % 5 : 0}
        />
      ),
    }));
  }, [
    profile?.identity.groupMetadata?.proposedUsername,
    state.selectedConnections,
  ]);

  const openSignerModal = () => setOpenSigners(true);

  const updateMembers = (data: ConnectionShortDetails[]) => {
    setState((state) => ({
      ...state,
      selectedConnections: [...data],
    }));

    openSignerModal();
  };

  const updateSigners = (data: SignerData) => {
    setState({
      ...state,
      signer: data,
    });
  };

  const createMultisigIdentifier = async () => {
    const { ourIdentifier } = state;
    if (!ourIdentifier) {
      logger.warn(
        "Attempting to create multi-sig without a corresponding normal AID to manage local keys"
      );
      return;
    } else {
      setLoading(true);

      try {
        if (!state.signer.recoverySigners || !state.signer.requiredSigners) {
          throw new Error("Invalid threshold value");
        }

        const mutilsigId = await Agent.agent.multiSigs.createGroup(
          ourIdentifier,
          state.selectedConnections as MultisigConnectionDetails[],
          {
            rotationThreshold: state.signer.recoverySigners,
            signingThreshold: state.signer.requiredSigners,
          }
        );
        dispatch(setToastMsg(ToastMsgType.GROUP_REQUEST_SEND));
        history.replace(
          RoutePath.GROUP_PROFILE_SETUP.replace(":id", mutilsigId)
        );
      } catch (e) {
        showError(
          "Unable to create group",
          e,
          dispatch,
          ToastMsgType.UNABLE_CREATE_GROUP_ERROR
        );
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <>
      <ScrollablePageLayout
        pageId={componentId}
        header={
          <PageHeader
            title={`${i18n.t("setupgroupprofile.initgroup.title")}`}
            closeButton
            closeButtonLabel={`${i18n.t(
              "setupgroupprofile.initgroup.button.back"
            )}`}
            closeButtonAction={openCloseAlert}
          />
        }
        footer={
          <PageFooter
            pageId={componentId}
            primaryButtonAction={createMultisigIdentifier}
            primaryButtonText={`${i18n.t(
              "setupgroupprofile.initgroup.button.sendrequest"
            )}`}
            primaryButtonDisabled={
              (state.signer.recoverySigners || 0) === 0 ||
              (state.signer.requiredSigners || 0) === 0
            }
            tertiaryButtonAction={openCloseAlert}
            tertiaryButtonText={`${i18n.t(
              "setupgroupprofile.initgroup.button.cancel"
            )}`}
          />
        }
      >
        <p className="header-text">
          {i18n.t("setupgroupprofile.initgroup.text")}
        </p>
        <CardBlock
          title={i18n.t("setupgroupprofile.initgroup.name")}
          testId="groupname-block"
          className="groupname-block"
        >
          <CardDetailsContent
            testId="groupname"
            mainContent={`${state.newIdentifier.displayName}`}
          />
        </CardBlock>
        <CardBlock
          title={i18n.t("setupgroupprofile.initgroup.members")}
          testId="group-member-block"
          className="group-members"
          endSlotIcon={pencilOutline}
          onClick={() => {
            setOpenEditMembers(true);
          }}
        >
          <MemberList
            members={members}
            bottomText={`${i18n.t(
              `setupgroupprofile.initgroup.numberofmember`,
              {
                members: members?.length || 0,
              }
            )}`}
          />
        </CardBlock>
        {state.signer.recoverySigners === 0 ||
        state.signer.requiredSigners === 0 ? (
          <CardBlock
            testId="signer-alert"
            className="signer-alert"
          >
            <IonIcon
              className="signer-alert-icon"
              icon={warningOutline}
            />
            <p className="alert-text">
              {i18n.t("setupgroupprofile.initgroup.thresholdalert")}
            </p>
            <IonButton
              shape="round"
              expand="full"
              fill="outline"
              className="secondary-button"
              onClick={openSignerModal}
            >
              {i18n.t("setupgroupprofile.initgroup.button.setsigner")}
            </IonButton>
          </CardBlock>
        ) : (
          <>
            <CardBlock
              flatBorder={FlatBorderType.BOT}
              title={i18n.t(
                "setupgroupprofile.initgroup.setsigner.requiredsigners"
              )}
              testId="required-signer-block"
              className="required-signer"
              endSlotIcon={pencilOutline}
              onClick={openSignerModal}
            >
              <CardDetailsContent
                testId="required-signer-key"
                mainContent={`${i18n.t(
                  `setupgroupprofile.initgroup.setsigner.members`,
                  {
                    members: state.signer.requiredSigners || 0,
                  }
                )}`}
              />
            </CardBlock>
            <CardBlock
              className="recovery-signer"
              title={i18n.t(
                "setupgroupprofile.initgroup.setsigner.recoverysigners"
              )}
              flatBorder={FlatBorderType.TOP}
              testId="recovery-signer-block"
            >
              <CardDetailsContent
                testId="recovery-signer-key"
                mainContent={`${i18n.t(
                  `setupgroupprofile.initgroup.setsigner.members`,
                  {
                    members: state.signer.recoverySigners || 0,
                  }
                )}`}
              />
            </CardBlock>
          </>
        )}
      </ScrollablePageLayout>
      <Spinner
        show={loading}
        coverage={SpinnerConverage.Screen}
      />
      <SetupSignerModal
        isOpen={openSigners}
        setOpen={setOpenSigners}
        connectionsLength={state.selectedConnections.length + 1}
        currentValue={state.signer}
        onSubmit={updateSigners}
      />
      <SetupMemberModal
        isOpen={openEditMembers}
        setOpen={setOpenEditMembers}
        connections={state.scannedConections}
        currentSelectedConnections={state.selectedConnections}
        onSubmit={updateMembers}
      />
      <Alert
        isOpen={openCancelAlert}
        setIsOpen={setOpenCancelAlert}
        dataTestId="alert-cancel-init-group"
        headerText={i18n.t("setupgroupprofile.confirm.cancel.text")}
        confirmButtonText={`${i18n.t(
          "setupgroupprofile.confirm.cancel.confirm"
        )}`}
        cancelButtonText={`${i18n.t(
          "setupgroupprofile.confirm.cancel.cancel"
        )}`}
        actionConfirm={handleClose}
        actionDismiss={() => setOpenCancelAlert(false)}
      />
    </>
  );
};

export { InitializeGroup };
