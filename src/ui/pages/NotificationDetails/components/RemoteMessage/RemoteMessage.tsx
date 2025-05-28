import { openOutline } from "ionicons/icons";
import React, { useEffect, useState } from "react";
import { Agent } from "../../../../../core/agent/agent";
import { HumanReadableMessage } from "../../../../../core/agent/services/connectionService.types";
import { i18n } from "../../../../../i18n";
import { useAppDispatch } from "../../../../../store/hooks";
import { ScrollablePageLayout } from "../../../../components/layout/ScrollablePageLayout";
import { PageFooter } from "../../../../components/PageFooter";
import { PageHeader } from "../../../../components/PageHeader";
import { showError } from "../../../../utils/error";
import { openBrowserLink } from "../../../../utils/openBrowserLink";
import { NotificationDetailsProps } from "../../NotificationDetails.types";
import "./RemoteMessage.scss";

function RemoteMessage({
  pageId,
  activeStatus,
  notificationDetails,
  handleBack,
}: NotificationDetailsProps) {
  const dispatch = useAppDispatch();
  const [message, setMessage] = useState<HumanReadableMessage>();

  useEffect(() => {
    async function getMessage() {
      try {
        const message = await Agent.agent.connections.getHumanReadableMessage(
          notificationDetails.a.d as string
        );
        setMessage(message);
      } catch (e) {
        showError("Failed to get sign information", e, dispatch);
      }
    }

    getMessage();
  }, [dispatch, notificationDetails.a.d]);

  const link = message?.l?.a;
  const text = message?.l?.t;

  const formatNewLines = (text: string[]) => {
    return text.map((line, index) => (
      <React.Fragment key={index}>
        {line}
        <br />
      </React.Fragment>
    ));
  };

  return (
    <ScrollablePageLayout
      activeStatus={activeStatus}
      pageId={pageId}
      customClass="custom-sign-confirmation"
      header={
        <PageHeader
          closeButton={true}
          closeButtonAction={handleBack}
          closeButtonLabel={`${i18n.t(
            "tabs.notifications.details.buttons.close"
          )}`}
          title={message?.t}
        />
      }
      footer={
        <PageFooter
          customClass="sign-confirmation-footer"
          primaryButtonIcon={openOutline}
          primaryButtonText={text}
          primaryButtonAction={() => openBrowserLink(link || "")}
        />
      }
    >
      <div className="sign-confirmation-body">
        <h3>{message?.st || ""}</h3>
        <p>{formatNewLines(message?.c || [])}</p>
      </div>
    </ScrollablePageLayout>
  );
}

export { RemoteMessage };
