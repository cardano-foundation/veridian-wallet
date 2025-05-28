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

const ConnectionHistoryEvent = ({
  index,
  historyItem,
  connectionDetails,
}: {
  index?: number;
  historyItem?: ConnectionHistoryItem;
  connectionDetails?: ConnectionDetails;
}) => {
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
              src={connectionDetails?.logo}
              alt="connection-logo"
            />
          ) : (
            <CardTheme />
          )}
      </div>
      <p className="connection-details-history-event-info">
        <span className="connection-details-history-text">
          {historyItem.type === ConnectionHistoryType.CREDENTIAL_ISSUANCE &&
            i18next.t("connections.details.issuance", {
              credential: historyItem.credentialType
                ?.replace(/([A-Z][a-z])/g, " $1")
                .replace(/^ /, "")
                .replace(/(\d)/g, "$1")
                .replace(/ {2,}/g, " "),
            })}
          {historyItem.type ===
            ConnectionHistoryType.CREDENTIAL_REQUEST_PRESENT &&
            i18next.t("connections.details.requestpresent", {
              issuer: connectionDetails?.label,
            })}
          {historyItem.type === ConnectionHistoryType.CREDENTIAL_PRESENTED &&
            i18n.t("connections.details.presented", {
              credentialType: historyItem.credentialType,
            })}
          {historyItem.type === ConnectionHistoryType.CREDENTIAL_REVOKED &&
            i18next.t("connections.details.update", {
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
          src={connectionDetails?.logo}
          alt="connection-logo"
        />
      </div>
      <p className="connection-details-history-event-info">
        <span className="connection-details-history-text">
          {i18next.t("connections.details.connectedwith", {
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
