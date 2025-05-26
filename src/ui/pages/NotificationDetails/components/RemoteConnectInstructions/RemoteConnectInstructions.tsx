import { t } from "i18next";
import { i18n } from "../../../../../i18n";
import { useAppDispatch } from "../../../../../store/hooks";
import { setCurrentOperation } from "../../../../../store/reducers/stateCache";
import { CardDetailsBlock } from "../../../../components/CardDetails";
import { ScrollablePageLayout } from "../../../../components/layout/ScrollablePageLayout";
import { PageFooter } from "../../../../components/PageFooter";
import { PageHeader } from "../../../../components/PageHeader";
import { OperationType } from "../../../../globals/types";
import { NotificationDetailsProps } from "../../NotificationDetails.types";
import "./RemoteConnectInstructions.scss";

function RemoteConnectInstructions({
  pageId,
  activeStatus,
  notificationDetails,
  handleBack,
}: NotificationDetailsProps) {
  const dispatch = useAppDispatch();
  const connection = notificationDetails.a.name;

  const handleClick = () => {
    dispatch(setCurrentOperation(OperationType.SCAN_CONNECTION));
  };

  return (
    <ScrollablePageLayout
      activeStatus={activeStatus}
      pageId={pageId}
      customClass="connection-instructions"
      header={
        <PageHeader
          closeButton={true}
          closeButtonAction={handleBack}
          closeButtonLabel={`${i18n.t(
            "tabs.notifications.details.buttons.close"
          )}`}
          title={`${i18n.t(
            "tabs.notifications.details.connectinstructions.title"
          )}`}
        />
      }
      footer={
        <PageFooter
          customClass="sign-confirmation-footer"
          primaryButtonText={`${t(
            "tabs.notifications.details.connectinstructions.button.label"
          )}`}
          primaryButtonAction={handleClick}
        />
      }
    >
      <div className="connection-instructions-body">
        <h3>
          {t("tabs.notifications.details.connectinstructions.subtitle", {
            connection: connection,
          })}
        </h3>
        <p>
          {t("tabs.notifications.details.connectinstructions.description", {
            connection: connection,
          })}
        </p>
        <CardDetailsBlock className="steps">
          <ol className="tips">
            <li>
              {i18n.t(
                "tabs.notifications.details.connectinstructions.steps.one"
              )}
            </li>
            <li>
              {i18n.t(
                "tabs.notifications.details.connectinstructions.steps.two",
                {
                  connection: connection,
                }
              )}
            </li>
            <li>
              {i18n.t(
                "tabs.notifications.details.connectinstructions.steps.three"
              )}
            </li>
            <li>
              {i18n.t(
                "tabs.notifications.details.connectinstructions.steps.four"
              )}
            </li>
            <li>
              {i18n.t(
                "tabs.notifications.details.connectinstructions.steps.five"
              )}
            </li>
            <li>
              {i18n.t(
                "tabs.notifications.details.connectinstructions.steps.six",
                {
                  connection: connection,
                }
              )}
            </li>
          </ol>
        </CardDetailsBlock>
      </div>
    </ScrollablePageLayout>
  );
}

export { RemoteConnectInstructions };
