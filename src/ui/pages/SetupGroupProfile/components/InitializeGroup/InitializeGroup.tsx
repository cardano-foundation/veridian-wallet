import { IonButton, IonIcon } from "@ionic/react";
import { pencilOutline, star, warningOutline } from "ionicons/icons";
import { useMemo, useState } from "react";
import { ConnectionShortDetails } from "../../../../../core/agent/agent.types";
import { i18n } from "../../../../../i18n";
import { useAppSelector } from "../../../../../store/hooks";
import { getCurrentProfile } from "../../../../../store/reducers/profileCache";
import { Alert } from "../../../../components/Alert";
import { MemberAvatar } from "../../../../components/Avatar";
import {
  CardBlock,
  CardDetailsContent,
  CardDetailsItem,
  FlatBorderType,
} from "../../../../components/CardDetails";
import { ScrollablePageLayout } from "../../../../components/layout/ScrollablePageLayout";
import { PageFooter } from "../../../../components/PageFooter";
import { PageHeader } from "../../../../components/PageHeader";
import { Stage, StageProps } from "../../SetupGroupProfile.types";
import { SetupMemberModal } from "../SetupMemberModal/SetupMemberModal";
import { SetupSignerModal } from "../SetupSignerModal";
import { SignerData } from "../SetupSignerModal/SetupSignerModal.types";
import "./InitializeGroup.scss";

const InitializeGroup = ({ state, setState }: StageProps) => {
  const componentId = "init-group";
  const [openCancelAlert, setOpenCancelAlert] = useState(false);
  const [openSigners, setOpenSigners] = useState(false);
  const [openEditMembers, setOpenEditMembers] = useState(false);

  const profile = useAppSelector(getCurrentProfile);

  const openCloseAlert = () => setOpenCancelAlert(true);

  const handleClose = () => {
    setState((state) => ({ ...state, stage: Stage.SetupConnection }));
  };

  const members = useMemo(() => {
    const members = state.selectedConnections?.map((member) => {
      const name = member?.label || "";

      return {
        name,
        isCurrentUser: false,
      };
    });

    members.unshift({
      name: profile?.identity.displayName || "",
      isCurrentUser: true,
    });

    return members.map((member, index) => ({
      ...member,
      rank: index >= 0 ? index % 5 : 0,
    }));
  }, [profile?.identity.displayName, state.selectedConnections]);

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
            primaryButtonAction={() => true}
            primaryButtonText={`${i18n.t(
              "setupgroupprofile.initgroup.button.sendrequest"
            )}`}
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
          {members.map((item, index) => {
            return (
              <CardDetailsItem
                key={index}
                info={item.name}
                startSlot={
                  <MemberAvatar
                    firstLetter={item.name.at(0)?.toLocaleUpperCase() || ""}
                    rank={item.rank}
                  />
                }
                className="member"
                testId={`group-member-${index}`}
                endSlot={
                  item.isCurrentUser && (
                    <div className="user-label">
                      <IonIcon icon={star} />
                      <span>{i18n.t("profiledetails.detailsmodal.you")}</span>
                    </div>
                  )
                }
              />
            );
          })}
          <p className="bottom-text">
            {i18n.t(`setupgroupprofile.initgroup.numberofmember`, {
              members: members?.length || 0,
            })}
          </p>
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
                    members: state.signer.requiredSigners,
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
                    members: state.signer.recoverySigners,
                  }
                )}`}
              />
            </CardBlock>
          </>
        )}
      </ScrollablePageLayout>
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
