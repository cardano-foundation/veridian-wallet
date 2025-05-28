import { IonSpinner } from "@ionic/react";
import { useCallback, useState } from "react";
import { Agent } from "../../../../../core/agent/agent";
import { IdentifierType } from "../../../../../core/agent/services/identifier.types";
import { CredentialsMatchingApply } from "../../../../../core/agent/services/ipexCommunicationService.types";
import { i18n } from "../../../../../i18n";
import { useAppDispatch, useAppSelector } from "../../../../../store/hooks";
import { getMultisigConnectionsCache } from "../../../../../store/reducers/connectionsCache";
import { getIdentifiersCache } from "../../../../../store/reducers/identifiersCache";
import { getAuthentication } from "../../../../../store/reducers/stateCache";
import { Alert } from "../../../../components/Alert";
import { useOnlineStatusEffect } from "../../../../hooks";
import { showError } from "../../../../utils/error";
import { NotificationDetailsProps } from "../../NotificationDetails.types";
import { ChooseCredential } from "./ChooseCredential";
import "./CredentialRequest.scss";
import { LinkedGroup } from "./CredentialRequest.types";
import { CredentialRequestInformation } from "./CredentialRequestInformation";

const CredentialRequest = ({
  pageId,
  activeStatus,
  notificationDetails,
  handleBack,
}: NotificationDetailsProps) => {
  const dispatch = useAppDispatch();
  const identifiersData = useAppSelector(getIdentifiersCache);
  const multisignConnectionsCache = useAppSelector(getMultisigConnectionsCache);
  const userName = useAppSelector(getAuthentication)?.userName;
  const [requestStage, setRequestStage] = useState(0);
  const [credentialRequest, setCredentialRequest] =
    useState<CredentialsMatchingApply | null>();

  const [linkedGroup, setLinkedGroup] = useState<LinkedGroup | null>(null);
  const [isOpenAlert, setIsOpenAlert] = useState(false);

  const reachThreshold =
    linkedGroup &&
    linkedGroup.othersJoined.length +
      (linkedGroup.linkedRequest.accepted ? 1 : 0) >=
      Number(linkedGroup.threshold);

  const userAID = !credentialRequest
    ? null
    : identifiersData[credentialRequest.identifier]?.groupMemberPre || null;

  const getMultisigInfo = useCallback(async () => {
    const linkedGroup =
      await Agent.agent.ipexCommunications.getLinkedGroupFromIpexApply(
        notificationDetails.id
      );

    const memberInfos = linkedGroup.members.map((member: string) => {
      const memberConnection = multisignConnectionsCache[member];
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

      const identifier = identifiersData[request.identifier];

      const identifierType =
        identifier?.groupMemberPre || identifier?.groupMetadata
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
  }, [notificationDetails, identifiersData, getMultisigInfo, dispatch]);

  useOnlineStatusEffect(getCrendetialRequest);

  const changeToStageTwo = () => {
    if (reachThreshold) {
      handleBack();
      return;
    }

    if (credentialRequest?.credentials.length === 0) {
      setIsOpenAlert(true);
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
    </div>
  );
};

export { CredentialRequest };
