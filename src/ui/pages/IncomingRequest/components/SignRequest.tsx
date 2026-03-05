import { IonIcon, IonText } from "@ionic/react";
import {
  chevronDownOutline,
  chevronUpOutline,
  keyOutline,
} from "ionicons/icons";
import { useEffect, useRef, useState } from "react";
import { i18n } from "../../../../i18n";
import { IncomingRequestType } from "../../../../store/reducers/stateCache/stateCache.types";
import {
  CardBlock,
  CardDetailsAttributes,
  CardDetailsItem,
} from "../../../components/CardDetails";
import { PageFooter } from "../../../components/PageFooter";
import { PageHeader } from "../../../components/PageHeader";
import { Spinner } from "../../../components/Spinner";
import { Verification } from "../../../components/Verification";
import { ScrollablePageLayout } from "../../../components/layout/ScrollablePageLayout";
import { combineClassNames } from "../../../utils/style";
import { RequestProps } from "../IncomingRequest.types";
import "./SignRequest.scss";

const SignRequest = ({
  pageId,
  activeStatus,
  requestData,
  initiateAnimation,
  handleAccept,
  handleCancel,
}: RequestProps<IncomingRequestType.PEER_CONNECT_SIGN>) => {
  const [verifyIsOpen, setVerifyIsOpen] = useState(false);
  const [displayExpandButton, setDisplayExpandButton] = useState(false);
  const [isExpand, setExpand] = useState(false);
  const attributeContainerRef = useRef<HTMLDivElement>(null);
  const attributeRef = useRef<HTMLDivElement>(null);
  const signRequest = requestData.signTransaction;
  const signDetails = (() => {
    if (!requestData.signTransaction) {
      return {};
    }

    let signContent;
    try {
      signContent = JSON.parse(requestData.signTransaction.payload.payload);
    } catch (error) {
      signContent = requestData.signTransaction.payload.payload;
    }
    return signContent;
  })();
  const logo = requestData.peerConnection.iconB64;

  const handleSign = () => {
    handleAccept();
  };

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
        customClass={`sign-request${initiateAnimation ? " blur" : ""}`}
        header={
          <PageHeader
            onBack={() => handleCancel()}
            title={`${i18n.t("request.sign.title")}`}
          />
        }
        footer={
          <PageFooter
            customClass="sign-footer"
            primaryButtonText={`${i18n.t("request.button.sign")}`}
            primaryButtonAction={() => setVerifyIsOpen(true)}
            secondaryButtonText={`${i18n.t("request.button.dontallow")}`}
            secondaryButtonAction={() => handleCancel()}
          />
        }
      >
        <div className="sign-header">
          <img
            className="sign-owner-logo"
            data-testid="sign-logo"
            src={logo}
            alt={requestData.peerConnection?.name}
          />
          <h2 className="sign-name">{requestData.peerConnection?.name}</h2>
          <p className="sign-link">{requestData.peerConnection?.url}</p>
        </div>
        <div className="sign-content">
          <CardBlock
            className="sign-identifier"
            testId="related-profile"
            title={i18n.t("request.sign.identifier")}
          >
            <CardDetailsItem
              info={`${signRequest?.payload.identifier.substring(
                0,
                5
              )}...${signRequest?.payload.identifier.slice(-5)}`}
              icon={keyOutline}
              className="member"
              testId="related-identifier-detail"
              mask={false}
            />
          </CardBlock>
          <CardBlock
            className={signContentCss}
            title={i18n.t("request.sign.transaction.data")}
          >
            <div
              ref={attributeContainerRef}
              className="content-container"
            >
              <div
                ref={attributeRef}
                className="content"
              >
                {typeof signDetails === "object" ? (
                  <CardDetailsAttributes
                    data={signDetails}
                    itemProps={{
                      mask: false,
                      fullText: true,
                      copyButton: false,
                      className: "sign-info-item",
                    }}
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
      <Spinner show={initiateAnimation} />
      <Verification
        verifyIsOpen={verifyIsOpen}
        setVerifyIsOpen={(isOpen) => setVerifyIsOpen(isOpen)}
        onVerify={() => handleSign()}
      />
    </>
  );
};

export { SignRequest };
