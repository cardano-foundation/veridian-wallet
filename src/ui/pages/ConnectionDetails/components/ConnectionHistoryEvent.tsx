import i18next from "i18next";
import {
  ConnectionDetails,
  ConnectionHistoryItem,
} from "../../../../core/agent/agent.types";
import { ConnectionHistoryType } from "../../../../core/agent/services/connectionService.types";
import { i18n } from "../../../../i18n";
import { CardTheme } from "../../../components/CardTheme";
import { FallbackIcon } from "../../../components/FallbackIcon";
import {
  formatShortDate,
  formatTimeToSec,
  getUTCOffset,
} from "../../../utils/formatters";
import MyFamilyPortal from "../../../assets/images/myfamily-portal.svg";
import Socialbook from "../../../assets/images/socialbook.svg";
import Mary from "../../../assets/images/Mary.jpg";
import Oliver from "../../../assets/images/Oliver.jpg";
import VitalRecordsAdmin from "../../../assets/images/vital-records-admin.png";

const ConnectionHistoryEvent = ({
  index,
  historyItem,
  connectionDetails,
}: {
  index?: number;
  historyItem?: ConnectionHistoryItem;
  connectionDetails?: ConnectionDetails;
}) => {
  const logo = (() => {
    if (connectionDetails?.label === "MyFamily Portal") {
      return MyFamilyPortal;
    }

    if (connectionDetails?.label === "Socialbook") {
      return Socialbook;
    }

    if (connectionDetails?.label === "Mary") {
      return Mary;
    }

    if (connectionDetails?.label === "Oliver") {
      return Oliver;
    }

    if (connectionDetails?.label === "State of Utah") {
      return VitalRecordsAdmin;
    }

    return connectionDetails?.logo;
  })();

  return historyItem ? (
    <div
      className="connection-details-history-event"
      data-testid={`connection-history-event-${index}`}
      key={index}
    >
      <div className="connection-details-logo">
        {historyItem.type ===
        ConnectionHistoryType.CREDENTIAL_REQUEST_PRESENT ? (
          <FallbackIcon
            src={logo}
            alt="connection-logo"
          />
        ) : (
          <CardTheme />
        )}
      </div>
      <p className="connection-details-history-event-info">
        <span className="connection-details-history-text">
          {historyItem.type === ConnectionHistoryType.CREDENTIAL_ISSUANCE &&
            i18next.t("tabs.connections.details.issuance", {
              credential: historyItem.credentialType
                ?.replace(/([A-Z][a-z])/g, " $1")
                .replace(/^ /, "")
                .replace(/(\d)/g, "$1")
                .replace(/ {2,}/g, " "),
            })}
          {historyItem.type ===
            ConnectionHistoryType.CREDENTIAL_REQUEST_PRESENT &&
            i18next.t("tabs.connections.details.requestpresent", {
              issuer: connectionDetails?.label,
            })}
          {historyItem.type === ConnectionHistoryType.CREDENTIAL_PRESENTED &&
            i18n.t("tabs.connections.details.presented", {
              credentialType: historyItem.credentialType,
            })}
          {historyItem.type === ConnectionHistoryType.CREDENTIAL_REVOKED &&
            i18next.t("tabs.connections.details.update", {
              credential: historyItem.credentialType
                ?.replace(/([A-Z][a-z])/g, " $1")
                .replace(/^ /, "")
                .replace(/(\d)/g, "$1")
                .replace(/ {2,}/g, " "),
            })}
        </span>
        <span
          data-testid="connection-history-timestamp"
          className="connection-details-history-timestamp"
        >
          {` ${formatShortDate(historyItem.timestamp)} - ${formatTimeToSec(
            historyItem.timestamp
          )} (${getUTCOffset(historyItem.timestamp)})`}
        </span>
      </p>
    </div>
  ) : (
    <div
      className="connection-details-history-event"
      data-testid="connection-history-event-connection"
    >
      <div className="connection-details-logo">
        <FallbackIcon
          src={logo}
          alt="connection-logo"
        />
      </div>
      <p className="connection-details-history-event-info">
        <span className="connection-details-history-text">
          {i18next.t("tabs.connections.details.connectedwith", {
            issuer: connectionDetails?.label,
          })}
        </span>
        <span
          data-testid="connection-detail-date"
          className="connection-details-history-timestamp"
        >
          {` ${formatShortDate(
            `${connectionDetails?.createdAtUTC}`
          )} - ${formatTimeToSec(
            `${connectionDetails?.createdAtUTC}`
          )} (${getUTCOffset(connectionDetails?.createdAtUTC)})`}
        </span>
      </p>
    </div>
  );
};

export { ConnectionHistoryEvent };
