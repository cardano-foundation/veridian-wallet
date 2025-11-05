import {
  IonCheckbox,
  IonIcon,
  IonLabel,
  IonSegment,
  IonSegmentButton,
} from "@ionic/react";
import { informationCircleOutline, warningOutline } from "ionicons/icons";
import { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { Agent } from "../../../../../../core/agent/agent";
import { CredentialStatus } from "../../../../../../core/agent/services/credentialService.types";
import { NotificationRoute } from "../../../../../../core/agent/services/keriaNotificationService.types";
import { i18n } from "../../../../../../i18n";
import { useAppSelector } from "../../../../../../store/hooks";
import {
  deleteNotificationById,
  getConnectionsCache,
  getCredsCache,
} from "../../../../../../store/reducers/profileCache";
import { setToastMsg } from "../../../../../../store/reducers/stateCache";
import { Alert } from "../../../../../components/Alert";
import { CardItem, CardList } from "../../../../../components/CardList";
import { BackReason } from "../../../../../components/CredentialDetailModule/CredentialDetailModule.types";
import { InfoCard } from "../../../../../components/InfoCard";
import { PageFooter } from "../../../../../components/PageFooter";
import { PageHeader } from "../../../../../components/PageHeader";
import { Verification } from "../../../../../components/Verification";
import { ScrollablePageLayout } from "../../../../../components/layout/ScrollablePageLayout";
import { ToastMsgType } from "../../../../../globals/types";
import { showError } from "../../../../../utils/error";
import {
  formatShortDate,
  formatTimeToSec,
} from "../../../../../utils/formatters";
import {
  ChooseCredentialProps,
  RequestCredential,
} from "../CredentialRequest.types";
import { LightCredentialDetailModal } from "../LightCredentialDetailModal";
import "./ChooseCredential.scss";

const ChooseCredential = ({
  pageId,
  activeStatus,
  credentialRequest,
  linkedGroup,
  onBack,
  reloadData,
  onSubmit,
  notificationDetails,
}: ChooseCredentialProps) => {
  const credsCache = useAppSelector(getCredsCache);
  const connections = useAppSelector(getConnectionsCache);
  const dispatch = useDispatch();
  const [selectedCred, setSelectedCred] = useState<RequestCredential | null>(
    null
  );
  const [verifyIsOpen, setVerifyIsOpen] = useState(false);
  const [alertDeclineIsOpen, setAlertDeclineIsOpen] = useState(false);
  const [viewCredDetail, setViewCredDetail] =
    useState<RequestCredential | null>(null);
  const [segmentValue, setSegmentValue] = useState("active");

  const mappedCredentials = credentialRequest.credentials.map(
    (cred): CardItem<RequestCredential> => {
      const connection =
        connections?.find((c) => c.id === cred.connectionId)?.label ||
        i18n.t("tabs.connections.unknown").toString();

      return {
        id: cred.acdc.d,
        title: connection,
        subtitle: `${formatShortDate(
          String(cred.acdc.a.dt)
        )} - ${formatTimeToSec(String(cred.acdc.a.dt))}`,
        data: { connectionId: cred.connectionId, acdc: cred.acdc },
      };
    }
  );

  const sortedCredentials = mappedCredentials.sort(function (a, b) {
    if (a.title < b.title) {
      return -1;
    }
    if (a.title > b.title) {
      return 1;
    }
    const dateA = new Date(String(a.data.acdc.a.dt)).getTime();
    const dateB = new Date(String(b.data.acdc.a.dt)).getTime();
    return dateA - dateB;
  });

  const revokedCredsCache = credsCache.filter(
    (item) => item.status === CredentialStatus.REVOKED
  );

  const revokedCredentials = sortedCredentials.filter((cred) =>
    revokedCredsCache.some((revoked) => revoked.id === cred.id)
  );

  const activeCredentials = sortedCredentials.filter(
    (cred) => !revokedCredsCache.some((revoked) => revoked.id === cred.id)
  );

  const handleSelectCred = useCallback((data: RequestCredential) => {
    setSelectedCred((selectedCred) =>
      selectedCred?.acdc.d === data.acdc.d ? null : data
    );
  }, []);

  const handleSelectCredOnModal = (reason: BackReason, selected: boolean) => {
    if (reason === BackReason.ARCHIVED) {
      reloadData();
      return;
    }

    const isShowSelectedCred = viewCredDetail?.acdc.d === selectedCred?.acdc.d;

    if (selected && !isShowSelectedCred) {
      setSelectedCred(viewCredDetail);
    }

    if (!selected && isShowSelectedCred) {
      setSelectedCred(null);
    }

    setViewCredDetail(null);
  };

  const handleRequestCredential = async () => {
    if (!selectedCred) {
      dispatch(setToastMsg(ToastMsgType.SHARE_CRED_FAIL));
      return;
    }

    onSubmit(selectedCred);
  };

  const handleBack = () => {
    onBack();
  };

  // @TODO - foconnor: joinedCredMembers and showCredMembers of these will default to all joined members, this UI will change.
  const joinedCredMembers = !viewCredDetail
    ? []
    : linkedGroup?.memberInfos.filter((member) => member.joined) || [];

  const decline = () => setAlertDeclineIsOpen(true);
  const closeAlert = () => setAlertDeclineIsOpen(false);

  const handleDecline = async () => {
    try {
      await Agent.agent.keriaNotifications.deleteNotificationRecordById(
        notificationDetails.id,
        notificationDetails.a.r as NotificationRoute
      );

      dispatch(deleteNotificationById(notificationDetails.id));
      onBack();
    } catch (e) {
      showError(
        "Unable to decline credential request",
        e,
        dispatch,
        ToastMsgType.PROPOSAL_CRED_FAIL
      );
    }
  };

  return (
    <>
      <ScrollablePageLayout
        pageId={`${pageId}-credential-choose`}
        activeStatus={activeStatus}
        customClass="choose-credential"
        header={
          <PageHeader
            title={`${i18n.t(
              "tabs.notifications.details.credential.request.choosecredential.title"
            )}`}
            closeButton
            closeButtonLabel={`${i18n.t(
              "tabs.notifications.details.buttons.back"
            )}`}
            closeButtonAction={handleBack}
            hardwareBackButtonConfig={{
              prevent: !activeStatus,
            }}
          />
        }
        footer={
          <PageFooter
            pageId={pageId}
            customClass="credential-request-footer"
            primaryButtonText={`${i18n.t(
              "tabs.notifications.details.buttons.choosecredential"
            )}`}
            primaryButtonAction={() => setVerifyIsOpen(true)}
            primaryButtonDisabled={!selectedCred}
            declineButtonText={`${i18n.t(
              "tabs.notifications.details.buttons.decline"
            )}`}
            declineButtonAction={decline}
          />
        }
      >
        <h2 className="title">
          {i18n.t(
            "tabs.notifications.details.credential.request.choosecredential.description",
            {
              requestCred: credentialRequest.schema.name,
            }
          )}
        </h2>
        <IonSegment
          data-testid="choose-credential-segment"
          value={segmentValue}
          onIonChange={(event) => setSegmentValue(`${event.detail.value}`)}
        >
          <IonSegmentButton
            value="active"
            data-testid="choose-credential-active-button"
          >
            <IonLabel>{`${i18n.t(
              "tabs.notifications.details.credential.request.choosecredential.active"
            )}`}</IonLabel>
          </IonSegmentButton>
          <IonSegmentButton
            value="revoked"
            data-testid="choose-credential-revoked-button"
          >
            <IonLabel>{`${i18n.t(
              "tabs.notifications.details.credential.request.choosecredential.revoked"
            )}`}</IonLabel>
          </IonSegmentButton>
        </IonSegment>
        {segmentValue === "revoked" && (
          <InfoCard
            content={i18n.t(
              "tabs.notifications.details.credential.request.choosecredential.disclaimer"
            )}
            className="revoke-info-card"
            icon={warningOutline}
          />
        )}
        {segmentValue === "active" && activeCredentials.length === 0 && (
          <h2 className="title">
            <i>
              {i18n.t(
                "tabs.notifications.details.credential.request.choosecredential.noactive",
                {
                  requestCred: credentialRequest.schema.name,
                }
              )}
            </i>
          </h2>
        )}
        {segmentValue === "revoked" && revokedCredentials.length === 0 && (
          <h2 className="title">
            <i>
              {i18n.t(
                "tabs.notifications.details.credential.request.choosecredential.norevoked",
                {
                  requestCred: credentialRequest.schema.name,
                }
              )}
            </i>
          </h2>
        )}
        <CardList
          data={
            segmentValue === "active" ? activeCredentials : revokedCredentials
          }
          onCardClick={(data, e) => {
            e.stopPropagation();
            handleSelectCred(data);
          }}
          onRenderStartSlot={(data) => {
            return (
              <IonIcon
                className="info-icon"
                icon={informationCircleOutline}
                data-testid={`cred-detail-${data.acdc.d}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setViewCredDetail(data);
                }}
              />
            );
          }}
          onRenderEndSlot={(data) => {
            return (
              <div className="item-action">
                <IonCheckbox
                  checked={selectedCred?.acdc?.d === data.acdc.d}
                  aria-label=""
                  className="checkbox"
                  data-testid={`cred-select-${data.acdc.d}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectCred(data);
                  }}
                />
              </div>
            );
          }}
        />
      </ScrollablePageLayout>
      <Verification
        verifyIsOpen={verifyIsOpen}
        setVerifyIsOpen={setVerifyIsOpen}
        onVerify={handleRequestCredential}
      />
      <Alert
        isOpen={alertDeclineIsOpen}
        setIsOpen={setAlertDeclineIsOpen}
        dataTestId="multisig-request-alert-decline"
        headerText={i18n.t(
          "tabs.notifications.details.credential.request.information.alert.textdecline"
        )}
        confirmButtonText={`${i18n.t(
          "tabs.notifications.details.buttons.decline"
        )}`}
        cancelButtonText={`${i18n.t(
          "tabs.notifications.details.buttons.cancel"
        )}`}
        actionConfirm={handleDecline}
        actionCancel={closeAlert}
        actionDismiss={closeAlert}
      />
      <LightCredentialDetailModal
        defaultSelected={viewCredDetail?.acdc.d === selectedCred?.acdc.d}
        credId={viewCredDetail?.acdc.d || ""}
        isOpen={!!viewCredDetail}
        setIsOpen={() => setViewCredDetail(null)}
        onClose={handleSelectCredOnModal}
        joinedCredRequestMembers={joinedCredMembers}
      />
    </>
  );
};

export { ChooseCredential };
