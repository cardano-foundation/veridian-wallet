import { IonText } from "@ionic/react";
import { useMemo, useState } from "react";
import { i18n } from "../../../../i18n";
import {
  CardDetailsAttributes,
  CardDetailsBlock,
} from "../../../components/CardDetails";
import { PageFooter } from "../../../components/PageFooter";
import { ScrollablePageLayout } from "../../../components/layout/ScrollablePageLayout";
import UserIcon from "../../../assets/images/intro-0.png";
import { RequestProps } from "../IncomingRequest.types";
import "./SignRequest.scss";
import { Spinner } from "../../../components/Spinner";
import { PageHeader } from "../../../components/PageHeader";
import { IncomingRequestType } from "../../../../store/reducers/stateCache/stateCache.types";
import { Verification } from "../../../components/Verification";

const VerifyRequest = ({
  pageId,
  activeStatus,
  requestData,
  initiateAnimation,
  handleAccept,
  handleCancel,
}: RequestProps<IncomingRequestType.PEER_CONNECT_VERIFY>) => {
  const [isVerifyingObject, setIsVerifyingObject] = useState(false);
  const [verifyIsOpen, setVerifyIsOpen] = useState(false);
  const verifyDetails = useMemo(() => {
    if (!requestData.verifyTransaction) {
      return {};
    }
    return requestData.verifyTransaction.payload.payload;
  }, [requestData.type]);

  const signRequest = requestData.verifyTransaction;
  const logo = requestData.peerConnection.iconB64 || UserIcon;

  const handleVerify = () => {
    handleAccept();
  };

  return (
    <>
      <ScrollablePageLayout
        activeStatus={activeStatus}
        pageId={pageId}
        customClass={`sign-request${initiateAnimation ? " blur" : ""}`}
        header={
          <PageHeader
            onBack={handleCancel}
            title={`${i18n.t("request.verify.title")} ${
              signRequest.payload.interaction
                ? "KEL"
                : i18n.t("request.verify.signature")
            }`}
          />
        }
        footer={
          <PageFooter
            customClass="sign-footer"
            primaryButtonText={`${i18n.t("request.button.verify")}`}
            primaryButtonAction={() => setVerifyIsOpen(true)}
            secondaryButtonText={`${i18n.t("request.button.dontallow")}`}
            secondaryButtonAction={handleCancel}
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
          <CardDetailsBlock
            className="sign-identifier"
            title={`${i18n.t("request.verify.identifier")}`}
          >
            <IonText className="identifier">
              {signRequest?.payload.identifier}
            </IonText>
          </CardDetailsBlock>
          {!signRequest.payload.interaction ? (
            <CardDetailsBlock
              className="sign-identifier"
              title={`${i18n.t("request.verify.signature")}`}
            >
              <IonText className="identifier">
                {signRequest?.payload?.signature}
              </IonText>
            </CardDetailsBlock>
          ) : null}
          {signRequest.payload.interaction ? (
            <CardDetailsBlock
              className="sign-identifier"
              title={`${i18n.t("request.verify.sequence")}`}
            >
              <IonText className="identifier">
                {signRequest?.payload?.sequence}
              </IonText>
            </CardDetailsBlock>
          ) : null}
          <CardDetailsBlock
            className="sign-data"
            title={i18n.t("request.verify.transaction.payload")}
          >
            {isVerifyingObject ? (
              <CardDetailsAttributes
                data={verifyDetails}
                itemProps={{
                  mask: false,
                  fullText: true,
                  copyButton: false,
                  className: "sign-info-item",
                }}
              />
            ) : (
              <IonText className="sign-string">
                {verifyDetails.toString()}
              </IonText>
            )}
          </CardDetailsBlock>
        </div>
      </ScrollablePageLayout>
      <Spinner show={initiateAnimation} />
      <Verification
        verifyIsOpen={verifyIsOpen}
        setVerifyIsOpen={setVerifyIsOpen}
        onVerify={handleVerify}
      />
    </>
  );
};

export { VerifyRequest };
