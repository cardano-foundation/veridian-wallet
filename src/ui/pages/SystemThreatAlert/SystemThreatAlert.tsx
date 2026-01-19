import { IonIcon } from "@ionic/react";
import {
  alertCircleOutline,
  helpCircleOutline,
  warningOutline,
} from "ionicons/icons";
import React from "react";
import { i18n } from "../../../i18n";
import { CardDetailsBlock } from "../../components/CardDetails";
import { InfoCard } from "../../components/InfoCard";
import { ScrollablePageLayout } from "../../components/layout/ScrollablePageLayout";
import { PageFooter } from "../../components/PageFooter";
import "./SystemThreatAlert.scss";
import { SystemThreatAlertProps } from "./SystemThreatAlert.types";
import { SUPPORT_EMAIL } from "../../globals/constants";

const SystemThreatAlert: React.FC<SystemThreatAlertProps> = ({
  errors,
  threats,
  deviceInfo,
}) => {
  const pageId = "system-threat-alert-page";

  return (
    <ScrollablePageLayout
      activeStatus
      pageId={pageId}
    >
      <div className="alert-container">
        <IonIcon
          icon={alertCircleOutline}
          className="warning-icon"
        />
        <h2 className="title">
          {i18n.t("systemthreats.title", {
            defaultValue: "Threats Detected",
          })}
        </h2>
        <p className="description">
          {i18n.t("systemthreats.description", {
            defaultValue:
              "The following security threats have been detected on your device:",
          })}
        </p>
        <CardDetailsBlock className="system-threats">
          {errors.map((error, i) => (
            <p
              key={`threat-errortext-${i}`}
              className="threat-error"
            >
              {error}
            </p>
          ))}
        </CardDetailsBlock>
        <InfoCard
          content={i18n.t("systemthreats.alert")}
          icon={warningOutline}
        />
        {(threats || deviceInfo) && (
          <CardDetailsBlock className="debug-info">
            <h3>Debug Information</h3>
            {threats && threats.length > 0 && (
              <div className="debug-section">
                <h4>Threat Codes:</h4>
                <ul>
                  {threats.map((t, i) => (
                    <li key={i}>{t.name}</li>
                  ))}
                </ul>
              </div>
            )}
            {deviceInfo && (
              <div className="debug-section">
                <h4>Device Info:</h4>
                <pre style={{ whiteSpace: "pre-wrap", fontSize: "10px" }}>
                  {JSON.stringify(deviceInfo, null, 2)}
                </pre>
              </div>
            )}
          </CardDetailsBlock>
        )}
        <PageFooter
          primaryButtonText={`${i18n.t("systemthreats.help")}`}
          primaryButtonIcon={helpCircleOutline}
          primaryButtonAction={SUPPORT_EMAIL}
        />
      </div>
    </ScrollablePageLayout>
  );
};

export { SystemThreatAlert };
