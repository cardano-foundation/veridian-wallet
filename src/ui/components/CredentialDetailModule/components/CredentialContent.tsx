import {
  calendarNumberOutline,
  informationCircleOutline,
  keyOutline,
} from "ionicons/icons";
import { useState } from "react";
import { IonItem, IonText } from "@ionic/react";
import { JSONObject } from "../../../../core/agent/agent.types";
import { i18n } from "../../../../i18n";
import { useAppSelector } from "../../../../store/hooks";
import {
  formatShortDate,
  formatTimeToSec,
  getUTCOffset,
} from "../../../utils/formatters";
import { Alert } from "../../Alert";
import {
  CardBlock,
  CardDetailsBlock,
  CardDetailsExpandAttributes,
  CardDetailsItem,
  FlatBorderType,
} from "../../CardDetails";
import { FallbackIcon } from "../../FallbackIcon";
import { ListHeader } from "../../ListHeader";
import { ReadMore } from "../../ReadMore";
import {
  CredentialContentProps,
  IssuedIdentifierProps,
  IssuerProps,
} from "./CredentialContent.types";
import { MultisigMember } from "./MultisigMember";
import { MemberAcceptStatus } from "./MultisigMember.types";
import { getProfiles } from "../../../../store/reducers/profileCache";
import { Avatar } from "../../Avatar";
import { openBrowserLink } from "../../../utils/openBrowserLink";
import MyFamilyPortal from "../../../assets/images/myfamily-portal.svg";
import Socialbook from "../../../assets/images/socialbook.svg";
import Mary from "../../../assets/images/Mary.jpg";
import Oliver from "../../../assets/images/Oliver.jpg";
import StateOfUtah from "../../../assets/images/state-of-utah.png";

const IGNORE_KEYS = ["i", "dt", "d", "u"];
const DOCUMENTATION_LINK = "https://secure.utah.gov/vitalrecords/index.html";

const RelatedProfile = ({ identifierId }: IssuedIdentifierProps) => {
  const profiles = useAppSelector(getProfiles);
  const profile = profiles[identifierId];

  return (
    <>
      {profile && (
        <CardDetailsBlock
          className="related-identifiers"
          data-testid="related-identifier-section"
        >
          <IonItem
            lines="none"
            className="related-identifier-label"
          >
            <IonText>
              {i18n.t("tabs.credentials.details.relatedprofile")}
            </IonText>
          </IonItem>
          <IonItem
            lines="none"
            className="related-identifier"
            data-testid="related-identifier-detail"
          >
            <Avatar
              id={
                profile.identity.displayName === "Mary"
                  ? "100"
                  : profile.identity.displayName === "Oliver"
                  ? "101"
                  : profile.identity.id
              }
            />
            <IonText
              className="identifier-name"
              data-testid="related-identifier-name"
            >
              {profile.identity.displayName}
            </IonText>
          </IonItem>
        </CardDetailsBlock>
      )}
    </>
  );
};

const Issuer = ({
  connectionShortDetails,
  setOpenConnectionlModal,
}: IssuerProps) => {
  const [showMissingIssuerModal, setShowMissingIssuerModal] = useState(false);

  const openConnection = () => {
    if (connectionShortDetails) {
      setOpenConnectionlModal(true);
    } else {
      setShowMissingIssuerModal(true);
    }
  };

  const closeAlert = () => setShowMissingIssuerModal(false);

  const logo = (() => {
    if (connectionShortDetails?.label === "MyFamily Portal") {
      return MyFamilyPortal;
    }

    if (connectionShortDetails?.label === "Socialbook") {
      return Socialbook;
    }

    if (connectionShortDetails?.label === "Mary") {
      return Mary;
    }

    if (connectionShortDetails?.label === "Oliver") {
      return Oliver;
    }

    if (connectionShortDetails?.label === "State of Utah") {
      return StateOfUtah;
    }
    return connectionShortDetails?.logo;
  })();

  return (
    <>
      <CardBlock
        title={i18n.t("tabs.credentials.details.issuer")}
        onClick={openConnection}
        testId="issuer"
      >
        <CardDetailsItem
          info={
            connectionShortDetails
              ? connectionShortDetails.label
              : i18n.t("tabs.connections.unknown")
          }
          startSlot={
            <FallbackIcon
              src={logo}
              alt="connection-logo"
            />
          }
          className="member"
          testId={"credential-details-issuer"}
        />
      </CardBlock>
      <Alert
        dataTestId="cred-missing-issuer-alert"
        headerText={i18n.t("tabs.credentials.details.alert.missingissuer.text")}
        confirmButtonText={`${i18n.t(
          "tabs.credentials.details.alert.missingissuer.confirm"
        )}`}
        isOpen={showMissingIssuerModal}
        setIsOpen={setShowMissingIssuerModal}
        actionConfirm={closeAlert}
        actionDismiss={closeAlert}
      />
    </>
  );
};

const CredentialContent = ({
  cardData,
  joinedCredRequestMembers,
  connectionShortDetails,
  setOpenConnectionlModal,
}: CredentialContentProps) => {
  return (
    <>
      <ListHeader title={i18n.t("tabs.credentials.details.about")} />
      <CardBlock
        flatBorder={FlatBorderType.BOT}
        title={i18n.t("tabs.credentials.details.type")}
        testId="credential-details-type-block"
      >
        <CardDetailsItem
          info={cardData.s.title}
          testId="credential-details-type"
          icon={informationCircleOutline}
          mask={false}
          fullText={false}
        />
      </CardBlock>
      <CardBlock
        className={"credential-details-read-more-block"}
        flatBorder={FlatBorderType.TOP}
        testId="readmore-block"
      >
        <ReadMore content={cardData.s.description}>
          {cardData.s.title === "Birth Certificate" && (
            <u onClick={() => openBrowserLink(DOCUMENTATION_LINK)}>
              {DOCUMENTATION_LINK}
            </u>
          )}
        </ReadMore>
      </CardBlock>
      {joinedCredRequestMembers && joinedCredRequestMembers.length > 0 && (
        <CardDetailsBlock
          title={i18n.t("tabs.credentials.details.joinedmember")}
        >
          {joinedCredRequestMembers?.map((member) => (
            <MultisigMember
              key={member.aid}
              name={member.name}
              status={MemberAcceptStatus.Accepted}
            />
          ))}
        </CardDetailsBlock>
      )}
      <ListHeader title={i18n.t("tabs.credentials.details.attributes.label")} />
      <CardBlock title={i18n.t("tabs.credentials.details.attributes.title")}>
        <CardDetailsExpandAttributes
          data={cardData.a as JSONObject}
          ignoreKeys={IGNORE_KEYS}
          openLevels={[1]}
        />
      </CardBlock>
      <ListHeader
        title={i18n.t("tabs.credentials.details.credentialdetails")}
      />
      <CardBlock
        title={i18n.t("tabs.credentials.details.status.issued")}
        testId={"credential-issued-label"}
      >
        <CardDetailsItem
          keyValue={formatShortDate(cardData.a.dt)}
          info={`${formatTimeToSec(cardData.a.dt)} (${getUTCOffset(
            cardData.a.dt
          )})`}
          testId={"credential-issued-section"}
          icon={calendarNumberOutline}
          className="credential-issued-section"
          mask={false}
          fullText
        />
      </CardBlock>
      <Issuer
        connectionShortDetails={connectionShortDetails}
        setOpenConnectionlModal={setOpenConnectionlModal}
      />
      <div className="credential-details-split-section">
        <CardBlock
          copyContent={cardData.id}
          title={i18n.t("tabs.credentials.details.id")}
          testId={"credential-details-id-block"}
        >
          <CardDetailsItem
            info={`${cardData.id.substring(0, 5)}...${cardData.id.slice(-5)}`}
            icon={keyOutline}
            testId={"credential-details-id"}
            className="credential-details-id"
            mask={false}
          />
        </CardBlock>
        <CardBlock
          title={i18n.t("tabs.credentials.details.schemaversion")}
          testId="schema-version"
        >
          <h2 data-testid="credential-details-schema-version">
            {cardData.s.version}
          </h2>
        </CardBlock>
      </div>
      <CardBlock
        title={i18n.t("tabs.credentials.details.status.label")}
        testId={"credential-details-last-status-label"}
      >
        <h2 data-testid="credential-details-last-status">
          {cardData.lastStatus.s === "0"
            ? i18n.t("tabs.credentials.details.status.issued")
            : i18n.t("tabs.credentials.details.status.revoked")}
        </h2>
        <p data-testid="credential-details-last-status-timestamp">
          {`${i18n.t(
            "tabs.credentials.details.status.timestamp"
          )} ${formatShortDate(cardData.lastStatus.dt)} - ${formatTimeToSec(
            cardData.lastStatus.dt
          )} (${getUTCOffset(cardData.lastStatus.dt)})`}
        </p>
      </CardBlock>
      <RelatedProfile identifierId={cardData.identifierId} />
    </>
  );
};

export { CredentialContent };
