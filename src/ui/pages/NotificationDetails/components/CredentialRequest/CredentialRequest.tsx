import { IonSpinner } from "@ionic/react";
import { useCallback, useState } from "react";
import { Agent } from "../../../../../core/agent/agent";
import { IdentifierType } from "../../../../../core/agent/services/identifier.types";
import { CredentialStatus } from "../../../../../core/agent/services/credentialService.types";
import { CredentialsMatchingApply } from "../../../../../core/agent/services/ipexCommunicationService.types";
import { i18n } from "../../../../../i18n";
import { useAppDispatch, useAppSelector } from "../../../../../store/hooks";
import {
  getMultisigConnectionsCache,
  getProfiles,
  getCredsCache,
  deleteNotificationById,
} from "../../../../../store/reducers/profileCache";
import {
  getAuthentication,
  setToastMsg,
} from "../../../../../store/reducers/stateCache";
import { Alert } from "../../../../components/Alert";
import { useOnlineStatusEffect } from "../../../../hooks";
import { showError } from "../../../../utils/error";
import { ToastMsgType } from "../../../../globals/types";
import { NotificationDetailsProps } from "../../NotificationDetails.types";
import { ChooseCredential } from "./ChooseCredential";
import "./CredentialRequest.scss";
import {
  LinkedGroup,
  RequestCredential,
  ACDC,
} from "./CredentialRequest.types";
import { CredentialRequestInformation } from "./CredentialRequestInformation";
import type { CredentialMetadataRecordProps } from "../../../../../core/agent/records/credentialMetadataRecord.types";
import { Verification } from "../../../../components/Verification";

const CredentialRequest = ({
  pageId,
  activeStatus,
  notificationDetails,
  handleBack,
}: NotificationDetailsProps) => {
  const dispatch = useAppDispatch();
  const profiles = useAppSelector(getProfiles);
  const credsCache = useAppSelector(getCredsCache);
  const multisignConnectionsCache = useAppSelector(
    getMultisigConnectionsCache
  ) as any[];
  const userName = useAppSelector(getAuthentication)?.userName;
  const [requestStage, setRequestStage] = useState(0);
  const [credentialRequest, setCredentialRequest] =
    useState<CredentialsMatchingApply | null>();

  const [linkedGroup, setLinkedGroup] = useState<LinkedGroup | null>(null);
  const [isOpenAlert, setIsOpenAlert] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suitableCredential, setSuitableCredential] =
    useState<RequestCredential | null>(null);
  const [verifyIsOpen, setVerifyIsOpen] = useState(false);

  const reachThreshold =
    linkedGroup &&
    linkedGroup.othersJoined.length +
      (linkedGroup.linkedRequest.accepted ? 1 : 0) >=
      Number(linkedGroup.threshold.signingThreshold);

  const userAID = !credentialRequest
    ? null
    : profiles[credentialRequest.identifier!]?.identity.groupMemberPre || null;

  const getMultisigInfo = useCallback(async () => {
    const linkedGroup =
      await Agent.agent.ipexCommunications.getLinkedGroupFromIpexApply(
        notificationDetails.id
      );

    const memberInfos = linkedGroup.members.map((member: string) => {
      const memberConnection = multisignConnectionsCache.find(
        (c) => c.id === member
      );
      if (!memberConnection) {
        return {
          aid: member,
          name: userName,
          joined: linkedGroup.linkedRequest.accepted,
        };
      }

      return {
        aid: member,
        name: memberConnection.label || member,
        joined: linkedGroup.othersJoined.includes(member),
      };
    });

    setLinkedGroup({
      ...linkedGroup,
      memberInfos,
    });
  }, [multisignConnectionsCache, notificationDetails.id, userName]);

  const getCrendetialRequest = useCallback(async () => {
    try {
      const request = await Agent.agent.ipexCommunications.getIpexApplyDetails(
        notificationDetails
      );

      const profile = profiles[request.identifier];

      const identifierType =
        profile?.identity.groupMemberPre || profile?.identity.groupMetadata
          ? IdentifierType.Group
          : IdentifierType.Individual;

      if (identifierType === IdentifierType.Group) {
        await getMultisigInfo();
      }

      setCredentialRequest(request);
    } catch (e) {
      handleBack();
      showError("Unable to get credential request detail", e, dispatch);
    }
  }, [notificationDetails, profiles, getMultisigInfo, dispatch]);

  useOnlineStatusEffect(getCrendetialRequest);

  // Function to get suitable credentials (similar to ChooseCredential logic)
  const getSuitableCredentials = useCallback(() => {
    if (!credentialRequest) return [];

    const revokedCredsCache = credsCache.filter(
      (item) => item.status === CredentialStatus.REVOKED
    );

    const mappedCredentials = credentialRequest.credentials.map(
      (cred): RequestCredential => ({
        connectionId: cred.connectionId,
        acdc: cred.acdc as unknown as ACDC,
      })
    );

    // Filter out revoked credentials to get active/suitable ones
    const activeCredentials = mappedCredentials.filter(
      (cred) => !revokedCredsCache.some((revoked) => revoked.id === cred.acdc.d)
    );

    return activeCredentials;
  }, [credentialRequest, credsCache]);

  // Function to automatically submit a credential
  const handleAutoSubmitCredential = useCallback(
    async (credential: RequestCredential) => {
      try {
        setLoading(true);

        await Agent.agent.ipexCommunications.offerAcdcFromApply(
          notificationDetails.id,
          credential.acdc as unknown as CredentialMetadataRecordProps
        );

        if (!linkedGroup) {
          dispatch(deleteNotificationById(notificationDetails.id));
        }

        dispatch(
          setToastMsg(
            !linkedGroup
              ? ToastMsgType.SHARE_CRED_SUCCESS
              : ToastMsgType.PROPOSED_CRED_SUCCESS
          )
        );
        handleBack();
      } catch (e) {
        dispatch(setToastMsg(ToastMsgType.SHARE_CRED_FAIL));
      } finally {
        setLoading(false);
      }
    },
    [notificationDetails.id, linkedGroup, dispatch, handleBack]
  );

  const changeToStageTwo = () => {
    if (reachThreshold) {
      handleBack();
      return;
    }

    if (credentialRequest?.credentials.length === 0) {
      setIsOpenAlert(true);
      return;
    }

    const suitableCredentials = getSuitableCredentials();

    if (suitableCredentials.length === 1) {
      setSuitableCredential(suitableCredentials[0]);
      setVerifyIsOpen(true);
      return;
    }

    setRequestStage(1);
  };

  const backToStageOne = () => {
    setRequestStage(0);
  };

  const handleClose = () => {
    setIsOpenAlert(false);
  };

  if (!credentialRequest) {
    return (
      <div
        className="credential-request-spinner-container"
        data-testid="credential-request-spinner-container"
      >
        <IonSpinner name="circular" />
      </div>
    );
  }

  return (
    <div className="credential-request-container">
      {requestStage === 0 ? (
        <CredentialRequestInformation
          onAccept={changeToStageTwo}
          pageId={pageId}
          activeStatus={activeStatus}
          notificationDetails={notificationDetails}
          credentialRequest={credentialRequest}
          linkedGroup={linkedGroup}
          onBack={handleBack}
          userAID={userAID}
          onReloadData={getCrendetialRequest}
        />
      ) : (
        <ChooseCredential
          pageId={pageId}
          activeStatus={activeStatus}
          credentialRequest={credentialRequest}
          notificationDetails={notificationDetails}
          linkedGroup={linkedGroup}
          onBack={backToStageOne}
          onClose={handleBack}
          reloadData={getCrendetialRequest}
        />
      )}
      {loading && (
        <div
          className="credential-request-spinner-container"
          data-testid="credential-request-auto-submit-spinner"
        >
          <IonSpinner name="circular" />
        </div>
      )}
      <Alert
        isOpen={isOpenAlert}
        setIsOpen={setIsOpenAlert}
        dataTestId="alert-empty-cred"
        headerText={i18n.t(
          "tabs.notifications.details.credential.request.alert.text"
        )}
        confirmButtonText={`${i18n.t(
          "tabs.notifications.details.credential.request.alert.confirm"
        )}`}
        actionConfirm={handleClose}
        actionDismiss={handleClose}
      />
      <Verification
        verifyIsOpen={verifyIsOpen}
        setVerifyIsOpen={setVerifyIsOpen}
        onVerify={() =>
          suitableCredential && handleAutoSubmitCredential(suitableCredential)
        }
      />
    </div>
  );
};

export { CredentialRequest };
