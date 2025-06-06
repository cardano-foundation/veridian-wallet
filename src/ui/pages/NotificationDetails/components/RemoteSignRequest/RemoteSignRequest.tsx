import { IonIcon, IonText } from "@ionic/react";
import {
  chevronDownOutline,
  chevronUpOutline,
  keyOutline,
  personCircleOutline,
} from "ionicons/icons";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Agent } from "../../../../../core/agent/agent";
import { RemoteSignRequest as RemoteSignRequestModel } from "../../../../../core/agent/services/identifier.types";
import { i18n } from "../../../../../i18n";
import { useAppDispatch, useAppSelector } from "../../../../../store/hooks";
import { getConnectionsCache } from "../../../../../store/reducers/connectionsCache";
import { setToastMsg } from "../../../../../store/reducers/stateCache";
import {
  CardBlock,
  CardDetailsAttributes,
  CardDetailsItem,
} from "../../../../components/CardDetails";
import { reservedKeysFilter } from "../../../../components/CardDetails/CardDetailsAttributes/CardDetailsAttributes.utils";
import { ScrollablePageLayout } from "../../../../components/layout/ScrollablePageLayout";
import { PageFooter } from "../../../../components/PageFooter";
import { PageHeader } from "../../../../components/PageHeader";
import { Spinner } from "../../../../components/Spinner";
import { SpinnerConverage } from "../../../../components/Spinner/Spinner.type";
import { Verification } from "../../../../components/Verification";
import { ToastMsgType } from "../../../../globals/types";
import { showError } from "../../../../utils/error";
import { combineClassNames } from "../../../../utils/style";
import { NotificationDetailsProps } from "../../NotificationDetails.types";
import "./RemoteSignRequest.scss";

function ellipsisText(text: string) {
  return `${text.substring(0, 8)}...${text.slice(-8)}`;
}

const RemoteSignRequest = ({
  pageId,
  activeStatus,
  handleBack,
  notificationDetails,
}: NotificationDetailsProps) => {
  const dispatch = useAppDispatch();
  const connections = useAppSelector(getConnectionsCache);
  const [isSigningObject, setIsSigningObject] = useState(false);
  const [verifyIsOpen, setVerifyIsOpen] = useState(false);
  const [isExpand, setExpand] = useState(false);
  const [displayExpandButton, setDisplayExpandButton] = useState(false);
  const attributeContainerRef = useRef<HTMLDivElement>(null);
  const attributeRef = useRef<HTMLDivElement>(null);
  const connectionName = connections[notificationDetails.connectionId];
  const [requestData, setRequestData] = useState<RemoteSignRequestModel>();
  const [loading, showLoading] = useState(true);

  useEffect(() => {
    const getSignData = async () => {
      try {
        showLoading(true);
        const requestData =
          await Agent.agent.identifiers.getRemoteSignRequestDetails(
            notificationDetails.a.d as string
          );
        setRequestData(requestData);
      } catch (e) {
        showError("Failed to get sign data", e, dispatch);
        handleBack();
      } finally {
        showLoading(false);
      }
    };

    getSignData();
  }, [dispatch, handleBack, notificationDetails.a.d]);

  const signDetails = useMemo(() => {
    if (!requestData?.payload) {
      setIsSigningObject(true);
      return {};
    }

    if (typeof requestData.payload === "object") {
      setIsSigningObject(true);
    }
    return requestData.payload;
  }, [requestData]);

  const handleSign = async () => {
    try {
      showLoading(true);
      await Agent.agent.identifiers.remoteSign(
        notificationDetails.id,
        notificationDetails.a.d as string
      );
      dispatch(setToastMsg(ToastMsgType.REMOTE_SIGN_SUCCESS));
      handleBack();
    } catch (e) {
      showError("Failed to sign", e, dispatch);
    } finally {
      showLoading(false);
    }
  };

  const itemProps = useCallback((key?: string) => {
    return {
      copyButton: false,
      className: "sign-info-item",
      keyValue: `${reservedKeysFilter(key || "")}:`,
      mask: false,
    };
  }, []);

  const onExpandData = () => {
    setExpand((value) => !value);
  };

  const signContentCss = combineClassNames("sign-data", {
    expand: isExpand,
  });

  useEffect(() => {
    // NOTE: Check attribute section height to show expand/collapse button
    if (!attributeRef.current || !attributeContainerRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      if (!attributeRef.current || !attributeContainerRef.current) return;

      const height = attributeRef.current.clientHeight;

      if (height < 1) return;

      const minCollapseHeight = 80; // 5rem

      // NOTE: If attribute section height greater than min height => show button
      setDisplayExpandButton(minCollapseHeight < height);
      attributeContainerRef.current.style.height =
        minCollapseHeight > height ? "auto" : "5rem";

      resizeObserver.disconnect();
    });

    resizeObserver.observe(attributeRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  useEffect(() => {
    function calcHeight() {
      if (!attributeRef.current || !attributeContainerRef.current) return;

      const height = attributeRef.current.clientHeight;
      const minCollapseHeight = 80; // 5rem

      if (isExpand) {
        attributeContainerRef.current.style.height = `${height}px`;
      } else {
        attributeContainerRef.current.style.height =
          minCollapseHeight > height ? "auto" : "5rem";
      }
    }

    calcHeight();
  }, [isExpand, signDetails]);

  return (
    <>
      <ScrollablePageLayout
        activeStatus={activeStatus}
        pageId={pageId}
        customClass="custom-sign-request"
        header={
          <PageHeader
            closeButton={true}
            closeButtonAction={handleBack}
            closeButtonLabel={`${i18n.t(
              "tabs.notifications.details.buttons.close"
            )}`}
            title={`${i18n.t("tabs.notifications.details.sign.title")}`}
          />
        }
        footer={
          <PageFooter
            customClass="sign-footer"
            primaryButtonText={`${i18n.t("request.button.sign")}`}
            primaryButtonAction={() => setVerifyIsOpen(true)}
            secondaryButtonText={`${i18n.t("request.button.dontallow")}`}
            secondaryButtonAction={handleBack}
          />
        }
      >
        <div className="sign-header">
          <div className="sign-owner-logo">
            <IonIcon
              data-testid="sign-logo"
              icon={personCircleOutline}
              color="light"
            />
          </div>
          <h2 className="sign-name">{connectionName?.label}</h2>
        </div>
        <h3 className="sign-info">
          {i18n.t("tabs.notifications.details.sign.info")}
        </h3>
        <div className="sign-content">
          <CardBlock
            title={`${i18n.t("tabs.notifications.details.sign.identifier")}`}
            testId="identifier-id-block"
            className="sign-identifier"
          >
            <CardDetailsItem
              info={ellipsisText(requestData?.identifier || "")}
              icon={keyOutline}
              testId="identifier-id"
              className="identifier-id"
              mask={false}
              copyButton
            />
          </CardBlock>
          <CardBlock
            title={i18n.t("tabs.notifications.details.sign.transaction.data")}
            className={signContentCss}
            testId="sign-data"
          >
            <div
              ref={attributeContainerRef}
              className="content-container"
            >
              <div
                ref={attributeRef}
                className="content"
              >
                {isSigningObject ? (
                  <CardDetailsAttributes
                    data={signDetails}
                    itemProps={itemProps}
                  />
                ) : (
                  <IonText className="sign-string">
                    {signDetails.toString()}
                  </IonText>
                )}
              </div>
            </div>
            {displayExpandButton && (
              <div
                className="footer"
                onClick={onExpandData}
              >
                <IonIcon
                  className="expand"
                  icon={isExpand ? chevronUpOutline : chevronDownOutline}
                />
              </div>
            )}
          </CardBlock>
        </div>
      </ScrollablePageLayout>
      <Spinner
        show={loading}
        coverage={SpinnerConverage.Screen}
      />
      <Verification
        verifyIsOpen={verifyIsOpen}
        setVerifyIsOpen={setVerifyIsOpen}
        onVerify={handleSign}
      />
    </>
  );
};

export { RemoteSignRequest };
