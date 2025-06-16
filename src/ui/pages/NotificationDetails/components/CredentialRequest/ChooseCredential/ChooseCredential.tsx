import {
  IonCheckbox,
  IonIcon,
  IonLabel,
  IonSegment,
  IonSegmentButton,
  IonSpinner,
} from "@ionic/react";
import { informationCircleOutline } from "ionicons/icons";
import { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { Agent } from "../../../../../../core/agent/agent";
import { CredentialStatus } from "../../../../../../core/agent/services/credentialService.types";
import { i18n } from "../../../../../../i18n";
import { useAppSelector } from "../../../../../../store/hooks";
import { getConnectionsCache } from "../../../../../../store/reducers/connectionsCache";
import { getCredsCache } from "../../../../../../store/reducers/credsCache";
import {
  getNotificationsCache,
  setNotificationsCache,
} from "../../../../../../store/reducers/notificationsCache";
import { setToastMsg } from "../../../../../../store/reducers/stateCache";
import { CardItem, CardList } from "../../../../../components/CardList";
import { BackReason } from "../../../../../components/CredentialDetailModule/CredentialDetailModule.types";
import { InfoCard } from "../../../../../components/InfoCard";
import { PageFooter } from "../../../../../components/PageFooter";
import { PageHeader } from "../../../../../components/PageHeader";
import { Verification } from "../../../../../components/Verification";
import { ScrollablePageLayout } from "../../../../../components/layout/ScrollablePageLayout";
import { ToastMsgType } from "../../../../../globals/types";
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

const CRED_EMPTY = "Credential is empty";

const ChooseCredential = ({
  pageId,
  activeStatus,
  credentialRequest,
  notificationDetails,
  linkedGroup,
  onBack,
  onClose,
  reloadData,
}: ChooseCredentialProps) => {
  const credsCache = useAppSelector(getCredsCache);
  const connections = useAppSelector(getConnectionsCache);
  const notifications = useAppSelector(getNotificationsCache);
  const dispatch = useDispatch();
  const [selectedCred, setSelectedCred] = useState<RequestCredential | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [verifyIsOpen, setVerifyIsOpen] = useState(false);
  const [viewCredDetail, setViewCredDetail] =
    useState<RequestCredential | null>(null);
  const [segmentValue, setSegmentValue] = useState("active");

  const mappedCredentials = credentialRequest.credentials.map(
    (cred): CardItem<RequestCredential> => {
      const connection =
        connections?.[cred.connectionId]?.label ||
        i18n.t("connections.unknown");

      return {
        id: cred.acdc.d,
        title: connection,
        subtitle: `${formatShortDate(cred.acdc.a.dt)} - ${formatTimeToSec(
          cred.acdc.a.dt
        )}`,
        data: cred,
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
    const dateA = new Date(a.data.acdc.a.dt).getTime();
    const dateB = new Date(b.data.acdc.a.dt).getTime();
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

  const handleNotificationUpdate = async () => {
    const updatedNotifications = notifications.filter(
      (notification) => notification.id !== notificationDetails.id
    );
    dispatch(setNotificationsCache(updatedNotifications));
  };

  const handleRequestCredential = async () => {
    try {
      if (!selectedCred) {
        throw Error(CRED_EMPTY);
      }

      setLoading(true);

      await Agent.agent.ipexCommunications.offerAcdcFromApply(
        notificationDetails.id,
        selectedCred.acdc
      );

      if (!linkedGroup) {
        handleNotificationUpdate();
      }

      dispatch(
        setToastMsg(
          !linkedGroup
            ? ToastMsgType.SHARE_CRED_SUCCESS
            : ToastMsgType.PROPOSED_CRED_SUCCESS
        )
      );
      onClose();
    } catch (e) {
      dispatch(setToastMsg(ToastMsgType.SHARE_CRED_FAIL));
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    onBack();
  };

  // @TODO - foconnor: joinedCredMembers and showCredMembers of these will default to all joined members, this UI will change.
  const joinedCredMembers = !viewCredDetail
    ? []
    : linkedGroup?.memberInfos.filter((member) => member.joined) || [];

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
              "tabs.notifications.details.buttons.providecredential"
            )}`}
            primaryButtonAction={() => setVerifyIsOpen(true)}
            primaryButtonDisabled={!selectedCred}
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
      {loading && (
        <div
          className="credential-request-spinner-container"
          data-testid="credential-request-spinner-container"
        >
          <IonSpinner name="circular" />
        </div>
      )}
      <Verification
        verifyIsOpen={verifyIsOpen}
        setVerifyIsOpen={setVerifyIsOpen}
        onVerify={handleRequestCredential}
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
