import { IonIcon, IonItem, IonText } from "@ionic/react";
import { alertCircleOutline, checkmark, closeOutline } from "ionicons/icons";
import React, { useEffect, useState } from "react";
import { SecureStorage } from "../../../core/storage";
import { i18n } from "../../../i18n";
import { CardDetailsBlock } from "../../components/CardDetails";
import { ScrollablePageLayout } from "../../components/layout/ScrollablePageLayout";
import {
  ANDROID_MIN_VERSION,
  IOS_MIN_VERSION,
  WEBVIEW_MIN_VERSION,
} from "../../globals/constants";
import { combineClassNames } from "../../utils/style";
import { compareVersion } from "../../utils/version";
import "./SystemCompatibilityAlert.scss";
import {
  MetRequirementStatus,
  RequirementItemProps,
  SystemCompatibilityAlertProps,
} from "./SystemCompatibilityAlert.types";

const RequirementItem = ({ name, value, status }: RequirementItemProps) => {
  const statusClasses = combineClassNames("status", {
    met: status === MetRequirementStatus.MetRequirement,
    "not-met": status === MetRequirementStatus.NotMetRequirement,
  });

  const icon = (() => {
    switch (status) {
      case MetRequirementStatus.MetRequirement:
        return checkmark;
      case MetRequirementStatus.NotMetRequirement:
        return closeOutline;
      default:
        return null;
    }
  })();

  return (
    <IonItem
      lines="none"
      className="requirement"
    >
      <IonText
        slot="start"
        className="name"
        data-testid="name"
      >
        {name}
      </IonText>
      <IonText
        className="requirement-value"
        slot="end"
        data-testid="requirement-value"
      >
        {value}
        {status !== undefined && icon && (
          <IonIcon
            data-testid={status}
            icon={icon}
            className={statusClasses}
          />
        )}
      </IonText>
    </IonItem>
  );
};

const SystemCompatibilityAlert: React.FC<SystemCompatibilityAlertProps> = ({
  deviceInfo,
}) => {
  const [isKeyStoreSupported, setIsKeyStoreSupported] = useState<
    boolean | undefined
  >(undefined);

  useEffect(() => {
    SecureStorage.isKeyStoreSupported().then((isKeyStoreSup) => {
      setIsKeyStoreSupported(isKeyStoreSup);
    });
  }, []);

  const getRequirementsList = () => {
    if (deviceInfo) {
      const isAndroidOsMet =
        deviceInfo.platform === "android" &&
        compareVersion(deviceInfo.osVersion, `${ANDROID_MIN_VERSION}`) >= 0;
      const isWebViewMet =
        deviceInfo.platform === "android" &&
        compareVersion(deviceInfo.webViewVersion, `${WEBVIEW_MIN_VERSION}`) >=
          0;
      const isIosMet =
        deviceInfo.platform === "ios" &&
        compareVersion(deviceInfo.osVersion, `${IOS_MIN_VERSION}`) >= 0;

      if (deviceInfo.platform === "android") {
        return (
          <>
            <RequirementItem
              name={i18n.t("systemcompatibility.android.os")}
              value={`${ANDROID_MIN_VERSION}+`}
            />
            <RequirementItem
              name={i18n.t("systemcompatibility.android.youros")}
              value={`${deviceInfo.osVersion}`}
              status={
                isAndroidOsMet
                  ? MetRequirementStatus.MetRequirement
                  : MetRequirementStatus.NotMetRequirement
              }
            />
            <RequirementItem
              name={i18n.t("systemcompatibility.android.webview")}
              value={`${WEBVIEW_MIN_VERSION}+`}
            />
            <RequirementItem
              name={i18n.t("systemcompatibility.android.yourwebview")}
              value={`${deviceInfo.webViewVersion}`}
              status={
                isWebViewMet
                  ? MetRequirementStatus.MetRequirement
                  : MetRequirementStatus.NotMetRequirement
              }
            />
            <RequirementItem
              name={i18n.t("systemcompatibility.android.storage")}
              value={
                isKeyStoreSupported === undefined
                  ? "N/A"
                  : isKeyStoreSupported
                    ? "Yes"
                    : "No"
              }
            />
          </>
        );
      }

      if (deviceInfo.platform === "ios") {
        return (
          <>
            <RequirementItem
              name={i18n.t("systemcompatibility.ios.os")}
              value={`${IOS_MIN_VERSION}+`}
            />
            <RequirementItem
              name={i18n.t("systemcompatibility.ios.youros")}
              value={`${deviceInfo.osVersion}`}
              status={
                isIosMet
                  ? MetRequirementStatus.MetRequirement
                  : MetRequirementStatus.NotMetRequirement
              }
            />
            <RequirementItem
              name={i18n.t("systemcompatibility.ios.storage")}
              value={
                isKeyStoreSupported === undefined
                  ? "N/A"
                  : isKeyStoreSupported
                    ? "Yes"
                    : "No"
              }
            />
          </>
        );
      }
    }

    return <p className="no-info">{i18n.t("systemcompatibility.noinfo")}</p>;
  };

  const pageId = "system-comp-alert-page";
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
        <h2 className="title">{i18n.t("systemcompatibility.title")}</h2>
        <p className="description">
          {i18n.t("systemcompatibility.description")}
        </p>
        <CardDetailsBlock className="system-requirements">
          {getRequirementsList()}
        </CardDetailsBlock>
      </div>
    </ScrollablePageLayout>
  );
};

export default SystemCompatibilityAlert;
