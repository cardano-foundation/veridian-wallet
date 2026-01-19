import { IonIcon } from "@ionic/react";
import {
  alertCircleOutline,
  checkmarkCircle,
  closeCircle,
  helpCircleOutline,
  warningOutline,
} from "ionicons/icons";
import React, { useEffect, useState } from "react";
import { i18n } from "../../../i18n";
import { CardDetailsBlock } from "../../components/CardDetails";
import { InfoCard } from "../../components/InfoCard";
import { ScrollablePageLayout } from "../../components/layout/ScrollablePageLayout";
import { PageFooter } from "../../components/PageFooter";
import "./SystemThreatAlert.scss";
import { SystemThreatAlertProps } from "./SystemThreatAlert.types";
import { SUPPORT_EMAIL } from "../../globals/constants";
import { SecureStorage } from "../../../core/storage";
import { ThreatName } from "../../../security/freerasp";

interface TestStep {
  name: string;
  status: "pending" | "running" | "success" | "error";
  message?: string;
}

const SystemThreatAlert: React.FC<SystemThreatAlertProps> = ({
  errors,
  threats,
  deviceInfo,
}) => {
  const pageId = "system-threat-alert-page";
  const [testSteps, setTestSteps] = useState<TestStep[]>([
    { name: "Write to SecureStorage", status: "pending" },
    { name: "Read from SecureStorage", status: "pending" },
    { name: "Verify Data Integrity", status: "pending" },
    { name: "Delete from SecureStorage", status: "pending" },
  ]);
  const [isTestRunning, setIsTestRunning] = useState(false);

  useEffect(() => {
    const hasSecureHardwareIssue = threats?.some(
      (t) => t.name === ThreatName.SECURE_HARDWARE_NOT_AVAILABLE
    );

    if (hasSecureHardwareIssue && !isTestRunning) {
      runStorageTest();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threats]);

  const updateStep = (
    index: number,
    status: TestStep["status"],
    message?: string
  ) => {
    setTestSteps((prev) => {
      const newSteps = [...prev];
      newSteps[index] = { ...newSteps[index], status, message };
      return newSteps;
    });
  };

  const runStorageTest = async () => {
    setIsTestRunning(true);
    const testKey = "system_threat_verification_test";
    const testValue = "verification_value_" + Date.now();

    try {
      // Step 1: Write
      updateStep(0, "running");
      await SecureStorage.set(testKey, testValue);
      updateStep(0, "success", "Value saved successfully");

      // Step 2: Read
      updateStep(1, "running");
      const param = { key: testKey };
      const retrievedValue = await SecureStorage.get(testKey);
      updateStep(1, "success", `Value retrieved: ${retrievedValue}`);

      // Step 3: Verify
      updateStep(2, "running");
      if (retrievedValue === testValue) {
        updateStep(2, "success", "Data matches original value");
      } else {
        throw new Error(
          `Mismatch: expected ${testValue}, got ${retrievedValue}`
        );
      }

      // Step 4: Delete
      updateStep(3, "running");
      await SecureStorage.delete(testKey);
      updateStep(3, "success", "Cleanup successful");
    } catch (error) {
      // Find the currently running step and mark it as error
      setTestSteps((prev) => {
        const runningIndex = prev.findIndex((s) => s.status === "running");
        if (runningIndex !== -1) {
          const newSteps = [...prev];
          newSteps[runningIndex] = {
            ...newSteps[runningIndex],
            status: "error",
            message: error instanceof Error ? error.message : String(error),
          };
          return newSteps;
        }
        return prev;
      });
    } finally {
      setIsTestRunning(false);
    }
  };

  return (
    <ScrollablePageLayout activeStatus pageId={pageId}>
      <div className="alert-container">
        <IonIcon icon={alertCircleOutline} className="warning-icon" />
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
            <p key={`threat-errortext-${i}`} className="threat-error">
              {error}
            </p>
          ))}
        </CardDetailsBlock>

        {/* Secure Storage Verification Experiment UI */}
        {threats?.some(
          (t) => t.name === ThreatName.SECURE_HARDWARE_NOT_AVAILABLE
        ) && (
            <CardDetailsBlock className="storage-experiment">
              <h3>Secure Storage Viability Experiment</h3>
              <p className="experiment-intro">
                Testing if secure storage works despite the hardware warning.
              </p>
              <div className="experiment-steps">
                {testSteps.map((step, i) => (
                  <div key={i} className={`experiment-step ${step.status}`}>
                    <div className="step-header">
                      <span className="step-icon">
                        {step.status === "success" && (
                          <IonIcon icon={checkmarkCircle} color="success" />
                        )}
                        {step.status === "error" && (
                          <IonIcon icon={closeCircle} color="danger" />
                        )}
                        {step.status === "running" && (
                          <span className="spinner-small" />
                        )}
                        {step.status === "pending" && (
                          <span className="dot-pending" />
                        )}
                      </span>
                      <span className="step-name">{step.name}</span>
                    </div>
                    {step.message && (
                      <div className="step-message">{step.message}</div>
                    )}
                  </div>
                ))}
              </div>
            </CardDetailsBlock>
          )}

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
