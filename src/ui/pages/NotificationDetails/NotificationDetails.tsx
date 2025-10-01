import { ElementType, useCallback, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import {
  KeriaNotification,
  NotificationRoute,
} from "../../../core/agent/services/keriaNotificationService.types";
import { TabsRoutePath } from "../../../routes/paths";
import { useAppSelector } from "../../../store/hooks";
import { getNotificationsCache } from "../../../store/reducers/profileCache";
import { useAppIonRouter } from "../../hooks";
import { CredentialRequest } from "./components/CredentialRequest";
import { MultiSigRequest } from "./components/MultiSigRequest";
import { ReceiveCredential } from "./components/ReceiveCredential";
import { RemoteConnectInstructions } from "./components/RemoteConnectInstructions";
import { RemoteMessage } from "./components/RemoteMessage";
import { RemoteSignRequest } from "./components/RemoteSignRequest";
import { CredentialShareRequest } from "./components/CredentialShareRequest";
import { CredentialIssuanceRequest } from "./components/CredentialIssuanceRequest";

const NotificationDetails = () => {
  const pageId = "notification-details";
  const ionicRouter = useAppIonRouter();
  const notificationCache = useAppSelector(getNotificationsCache);
  const { id } = useParams<{ id: string }>();

  const notificationDetails = notificationCache.find(
    (notification) => notification.id === id
  );

  const currentNotification = useRef<KeriaNotification | undefined>(
    notificationDetails
  );

  const handleBack = useCallback(() => {
    ionicRouter.push(TabsRoutePath.NOTIFICATIONS, "back", "pop");
  }, [ionicRouter]);

  const displayNotification =
    notificationDetails || currentNotification.current;

  useEffect(() => {
    if (!displayNotification) handleBack();
  }, [handleBack, displayNotification]);

  // Mapping object for NotificationRoute to components
  const notificationComponents: Record<NotificationRoute, ElementType | null> =
    {
      [NotificationRoute.MultiSigIcp]: MultiSigRequest,
      [NotificationRoute.ExnIpexGrant]: ReceiveCredential,
      [NotificationRoute.ExnIpexApply]: CredentialRequest,
      [NotificationRoute.MultiSigExn]: ReceiveCredential,
      [NotificationRoute.RemoteSignReq]: RemoteSignRequest,
      [NotificationRoute.ExnCoordinationCredentialsInfoReq]:
        CredentialShareRequest,
      [NotificationRoute.ExnCoordinationCredentialsIssueProp]:
        CredentialIssuanceRequest,
      [NotificationRoute.HumanReadableMessage]: RemoteMessage,
      [NotificationRoute.LocalSingletonConnectInstructions]:
        RemoteConnectInstructions,
      [NotificationRoute.MultiSigRpy]: null,
      [NotificationRoute.ExnIpexOffer]: null,
      [NotificationRoute.ExnIpexAgree]: null,
      [NotificationRoute.LocalAcdcRevoked]: null,
    };

  // Exit early for unsupported routes
  const unsupportedRoutes = [
    NotificationRoute.MultiSigRpy,
    NotificationRoute.ExnIpexOffer,
    NotificationRoute.ExnIpexAgree,
    NotificationRoute.LocalAcdcRevoked,
  ];

  if (
    !displayNotification ||
    unsupportedRoutes.includes(displayNotification.a?.r as NotificationRoute)
  ) {
    return null;
  }

  const Component =
    notificationComponents[displayNotification.a?.r as NotificationRoute];

  if (!Component) {
    return null; // Return null if no matching component is found
  }

  return (
    <Component
      pageId={pageId}
      activeStatus={!!displayNotification}
      notificationDetails={displayNotification}
      handleBack={handleBack}
      {...(displayNotification.a?.r === NotificationRoute.MultiSigExn
        ? { multisigExn: true }
        : {})} // Pass additional props conditionally
    />
  );
};

export { NotificationDetails };
