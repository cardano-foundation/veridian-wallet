import { Share } from "@capacitor/share";
import {
  IonButton,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonSpinner,
} from "@ionic/react";
import { shareOutline, trashOutline } from "ionicons/icons";
import { useState } from "react";
import { QRCode } from "react-qrcode-logo";
import { useParams } from "react-router-dom";
import { Agent } from "../../../../../core/agent/agent";
import { CreationStatus } from "../../../../../core/agent/agent.types";
import { i18n } from "../../../../../i18n";
import { TabsRoutePath } from "../../../../../routes/paths";
import { useAppDispatch } from "../../../../../store/hooks";
import { removeIdentifierCache } from "../../../../../store/reducers/identifiersCache";
import { setToastMsg } from "../../../../../store/reducers/stateCache";
import { Alert } from "../../../../components/Alert";
import { Verification } from "../../../../components/Verification";
import { ToastMsgType } from "../../../../globals/types";
import { useAppIonRouter } from "../../../../hooks";
import { showError } from "../../../../utils/error";
import { SetupConnectionsProps } from "./SetupConnections.types";

const SHARE_CANCELLED_ERROR = "Share canceled";
const ShareConnections = ({ group, oobi, profile }: SetupConnectionsProps) => {
  const dispatch = useAppDispatch();
  const { id: profileId } = useParams<{ id: string }>();
  const [verifyIsOpen, setVerifyIsOpen] = useState(false);
  const [alertDeleteOpen, setAlertDeleteOpen] = useState(false);
  const ionRouter = useAppIonRouter();

  const nativeShare = () => {
    Share.share({
      text: oobi,
    }).catch((e) => {
      if (e.message === SHARE_CANCELLED_ERROR) return;
      throw e;
    });
  };

  const handleDelete = async () => {
    if (!profileId) return;

    try {
      setVerifyIsOpen(false);

      await Agent.agent.identifiers.markIdentifierPendingDelete(profileId);

      dispatch(setToastMsg(ToastMsgType.IDENTIFIER_DELETED));
      dispatch(removeIdentifierCache(profileId));
      ionRouter.push(TabsRoutePath.CREDENTIALS);
    } catch (e) {
      showError(
        "Unable to delete identifier",
        e,
        dispatch,
        ToastMsgType.DELETE_IDENTIFIER_FAIL
      );
    }
  };

  const closeAlert = () => setAlertDeleteOpen(false);

  const isPending = profile?.creationStatus === CreationStatus.PENDING;

  return (
    <div className="setup-members-content">
      <div className="share-profile-oobi">
        <div className="share-profile-body">
          <div
            className={`share-profile-body-component share-qr ${
              oobi && !isPending ? "reveal" : "blur"
            }`}
            data-testid="share-profile-qr-code"
          >
            <QRCode
              value={oobi}
              size={250}
              fgColor={"black"}
              bgColor={"white"}
              qrStyle={"squares"}
              logoImage={""}
              logoWidth={60}
              logoHeight={60}
              logoOpacity={1}
              quietZone={10}
            />
            <span className="share-qr-code-blur-overlay-container">
              <span className="share-qr-code-blur-overlay-inner">
                {isPending && <IonSpinner name="circular" />}
                <div className="text">
                  <p className="top">
                    {i18n.t("setupgroupprofile.setupmembers.pending.top")}
                  </p>
                  <p className="bottom">
                    {i18n.t("setupgroupprofile.setupmembers.pending.bottom")}
                  </p>
                </div>
              </span>
            </span>
          </div>
          <IonButton
            shape="round"
            expand="block"
            fill="outline"
            className="primary-button share-button"
            onClick={nativeShare}
            disabled={!oobi || isPending}
          >
            <IonIcon
              slot="start"
              icon={shareOutline}
            />
            {i18n.t("setupgroupprofile.setupmembers.share")}
          </IonButton>
        </div>
      </div>
      <h3 className="members-list-title">
        {i18n.t("setupgroupprofile.setupmembers.subtitle")}
      </h3>
      {!group?.connections?.length ? (
        <p
          className="multisig-share-note multisig-share-note-footer"
          data-testid="multisig-share-note-bottom"
        >
          {i18n.t("setupgroupprofile.setupmembers.notes.bottom")}
        </p>
      ) : (
        <IonList className="members">
          {group.connections.map((connection, index) => {
            return (
              <IonItem key={connection.id}>
                <IonLabel className="connection-item">
                  <div className={`connection-avatar rank-${index % 5}`}>
                    <span>{connection.label.at(0)?.toLocaleUpperCase()}</span>
                  </div>
                  <span className="connection-name">{connection.label}</span>
                </IonLabel>
              </IonItem>
            );
          })}
        </IonList>
      )}
      <div className="setup-member-actions">
        <IonButton
          shape="round"
          expand="block"
          fill="clear"
          className="delete-button"
          data-testid="delete-button-initiate-multi-sig"
          onClick={() => setAlertDeleteOpen(true)}
        >
          <IonIcon
            slot="icon-only"
            size="small"
            icon={trashOutline}
            color="primary"
          />
          {i18n.t("setupgroupprofile.setupmembers.delete.button")}
        </IonButton>
      </div>
      <Alert
        isOpen={alertDeleteOpen}
        setIsOpen={setAlertDeleteOpen}
        dataTestId="alert-confirm-identifier-delete-details"
        headerText={i18n.t("setupgroupprofile.setupmembers.delete.alert.title")}
        confirmButtonText={`${i18n.t(
          "setupgroupprofile.setupmembers.delete.alert.confirm"
        )}`}
        cancelButtonText={`${i18n.t(
          "setupgroupprofile.setupmembers.delete.alert.cancel"
        )}`}
        actionConfirm={() => setVerifyIsOpen(true)}
        actionCancel={closeAlert}
        actionDismiss={closeAlert}
      />
      <Verification
        verifyIsOpen={verifyIsOpen}
        setVerifyIsOpen={setVerifyIsOpen}
        onVerify={handleDelete}
      />
    </div>
  );
};

export { ShareConnections };
