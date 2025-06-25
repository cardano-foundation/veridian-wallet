import { IonText } from "@ionic/react";
import { alertCircleOutline } from "ionicons/icons";
import { useState } from "react";
import { Trans } from "react-i18next";
import { IdentifierShortDetails } from "../../../../../core/agent/services/identifier.types";
import { i18n } from "../../../../../i18n";
import { useAppSelector } from "../../../../../store/hooks";
import { getMultisigConnectionsCache } from "../../../../../store/reducers/connectionsCache";
import { getIdentifiersCache } from "../../../../../store/reducers/identifiersCache";
import { CardDetailsBlock } from "../../../../components/CardDetails";
import { CreateGroupIdentifier } from "../../../../components/CreateGroupIdentifier";
import { InfoCard } from "../../../../components/InfoCard";
import { ScrollablePageLayout } from "../../../../components/layout/ScrollablePageLayout";
import { PageFooter } from "../../../../components/PageFooter";
import { PageHeader } from "../../../../components/PageHeader";
import { SUPPORT_EMAIL } from "../../../../globals/constants";
import "./ErrorPage.scss";
import { ErrorPageProps } from "./ErrorPage.types";

const ErrorPage = ({
  pageId,
  activeStatus,
  handleBack,
  notificationDetails,
  onFinishSetup,
}: ErrorPageProps) => {
  const identifierCache = useAppSelector(getIdentifiersCache);
  const connectionsCache = useAppSelector(getMultisigConnectionsCache);
  const [resumeMultiSig, setResumeMultiSig] =
    useState<IdentifierShortDetails | null>(null);

  const [createIdentifierModalIsOpen, setCreateIdentifierModalIsOpen] =
    useState(false);

  const actionAccept = () => {
    const multiSignGroupId =
      connectionsCache[notificationDetails.connectionId].groupId;

    const identifier = Object.values(identifierCache).find(
      (item) => item.groupMetadata?.groupId === multiSignGroupId
    );

    if (identifier) {
      setResumeMultiSig(identifier);
      setCreateIdentifierModalIsOpen(true);
    }
  };

  const handleCloseCreateIdentifier = () => {
    setCreateIdentifierModalIsOpen(false);
    onFinishSetup();
  };

  const HandleEmail = () => {
    return (
      <a
        data-testid="support-link-browser-handler"
        href={SUPPORT_EMAIL}
      >
        {i18n.t(
          "tabs.notifications.details.identifier.errorpage.help.emailaddress"
        )}
      </a>
    );
  };

  return (
    <>
      <ScrollablePageLayout
        pageId={`${pageId}-multi-sig-feedback`}
        customClass={`${pageId}-multi-sig-feedback setup-identifier`}
        activeStatus={activeStatus}
        header={
          <PageHeader
            closeButton={true}
            closeButtonAction={handleBack}
            closeButtonLabel={`${i18n.t(
              "tabs.notifications.details.buttons.close"
            )}`}
            title={`${i18n.t(
              "tabs.notifications.details.identifier.errorpage.title"
            )}`}
          />
        }
        footer={
          <PageFooter
            pageId={pageId}
            customClass="multisig-feedback-footer"
            primaryButtonText={`${i18n.t(
              "tabs.notifications.details.identifier.errorpage.continuesetup"
            )}`}
            primaryButtonAction={() => actionAccept()}
          />
        }
      >
        <InfoCard
          className="alert"
          content={i18n.t(
            "tabs.notifications.details.identifier.errorpage.alerttext"
          )}
          icon={alertCircleOutline}
        />
        <div className="instructions">
          <h2 className="title">
            {i18n.t(
              "tabs.notifications.details.identifier.errorpage.instructions.title"
            )}
          </h2>
          <IonText className="detail-text">
            {i18n.t(
              "tabs.notifications.details.identifier.errorpage.instructions.detailtext"
            )}
          </IonText>
          <CardDetailsBlock className="content">
            <ol className="instruction-list">
              <li>
                {i18n.t(
                  "tabs.notifications.details.identifier.errorpage.instructions.stepone"
                )}
              </li>
              <li>
                {i18n.t(
                  "tabs.notifications.details.identifier.errorpage.instructions.steptwo"
                )}
              </li>
            </ol>
          </CardDetailsBlock>
        </div>
        <div className="help">
          <h2 className="title">
            {i18n.t(
              "tabs.notifications.details.identifier.errorpage.help.title"
            )}
          </h2>
          <IonText className="detail-text">
            <Trans
              i18nKey={i18n.t(
                "tabs.notifications.details.identifier.errorpage.help.detailtext"
              )}
              components={[<HandleEmail key="" />]}
            />
          </IonText>
        </div>
      </ScrollablePageLayout>
      <CreateGroupIdentifier
        modalIsOpen={createIdentifierModalIsOpen}
        setModalIsOpen={handleCloseCreateIdentifier}
        resumeMultiSig={resumeMultiSig}
        setResumeMultiSig={setResumeMultiSig}
        preventRedirect
      />
    </>
  );
};

export { ErrorPage };
