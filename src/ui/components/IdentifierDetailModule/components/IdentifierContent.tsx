import { IonButton, IonIcon } from "@ionic/react";
import {
  calendarNumberOutline,
  keyOutline,
  refreshOutline,
} from "ionicons/icons";
import { useCallback, useState } from "react";
import { i18n } from "../../../../i18n";
import { useAppSelector } from "../../../../store/hooks";
import { getMultisigConnectionsCache } from "../../../../store/reducers/connectionsCache";
import { getIdentifiersCache } from "../../../../store/reducers/identifiersCache";
import { getAuthentication } from "../../../../store/reducers/stateCache";
import { CardDetailsContent } from "../../../components/CardDetails";
import {
  CardBlock,
  FlatBorderType,
} from "../../../components/CardDetails/CardDetailsBlock";
import { CardDetailsItem } from "../../../components/CardDetails/CardDetailsItem";
import { ListHeader } from "../../../components/ListHeader";
import {
  formatShortDate,
  formatTimeToSec,
  getUTCOffset,
} from "../../../utils/formatters";
import { IdentifierAttributeDetailModal } from "./IdentifierAttributeDetailModal/IdentifierAttributeDetailModal";
import { DetailView } from "./IdentifierAttributeDetailModal/IdentifierAttributeDetailModal.types";
import { IdentifierContentProps } from "./IdentifierContent.types";
import { FallbackIcon } from "../../FallbackIcon";

const DISPLAY_MEMBERS = 3;

const IdentifierContent = ({
  cardData,
  onRotateKey,
}: IdentifierContentProps) => {
  const identifiersData = useAppSelector(getIdentifiersCache);
  const userName = useAppSelector(getAuthentication)?.userName;
  const multisignConnectionsCache = useAppSelector(getMultisigConnectionsCache);
  const memberCount = cardData.members?.length || 0;
  const [openDetailModal, setOpenDetailModal] = useState(false);
  const [viewType, setViewType] = useState(DetailView.AdvancedDetail);

  const openPropDetailModal = useCallback((view: DetailView) => {
    setViewType(view);
    setOpenDetailModal(true);
  }, []);

  const isMultiSig =
    cardData.groupMemberPre || identifiersData[cardData.id]?.groupMemberPre;

  const members = cardData.members
    ?.map((member) => {
      const memberConnection = multisignConnectionsCache[member];
      let name = memberConnection?.label || member;

      if (!memberConnection?.label) {
        name = userName;
      }

      return name;
    })
    .slice(0, DISPLAY_MEMBERS);

  const openGroupMember = () => openPropDetailModal(DetailView.GroupMember);

  return (
    <>
      {isMultiSig && members && (
        <>
          <ListHeader title={i18n.t("tabs.identifiers.details.group.title")} />
          <CardBlock
            onClick={openGroupMember}
            title={i18n.t("tabs.identifiers.details.group.groupmembers.title")}
            testId="group-member-block"
          >
            {members.map((item, index) => {
              return (
                <CardDetailsItem
                  key={index}
                  info={item}
                  startSlot={<FallbackIcon />}
                  className="member"
                  testId={`group-member-${index}`}
                />
              );
            })}
            {members.length < memberCount && (
              <IonButton
                className="view-more-members"
                onClick={() => openPropDetailModal(DetailView.GroupMember)}
                data-testid="view-member"
              >
                {i18n.t("tabs.identifiers.details.group.button.viewmore", {
                  remainMembers: memberCount - DISPLAY_MEMBERS,
                })}
              </IonButton>
            )}
          </CardBlock>
          {cardData.kt && (
            <CardBlock
              title={i18n.t(
                "tabs.identifiers.details.group.signingkeysthreshold.title"
              )}
              onClick={() => openPropDetailModal(DetailView.SigningThreshold)}
              testId="signing-threshold-block"
            >
              <CardDetailsContent
                mainContent={`${cardData.kt}`}
                subContent={`${i18n.t(
                  "tabs.identifiers.details.group.signingkeysthreshold.outof",
                  { threshold: memberCount }
                )}`}
                testId="signing-threshold-content"
              />
            </CardBlock>
          )}
        </>
      )}
      <ListHeader
        title={i18n.t("tabs.identifiers.details.identifierdetail.title")}
      />
      <div className="identifier-details-split-section">
        <CardBlock
          copyContent={cardData.id}
          title={i18n.t(
            "tabs.identifiers.details.identifierdetail.identifierid.title"
          )}
          testId="identifier-id-block"
        >
          <CardDetailsItem
            info={`${cardData.id.substring(0, 5)}...${cardData.id.slice(-5)}`}
            icon={keyOutline}
            testId="identifier-id"
            className="identifier-id"
            mask={false}
          />
        </CardBlock>
        <CardBlock
          title={i18n.t(
            "tabs.identifiers.details.identifierdetail.created.title"
          )}
          testId="created-block"
        >
          <CardDetailsItem
            keyValue={formatShortDate(cardData.createdAtUTC)}
            info={`${formatTimeToSec(cardData.createdAtUTC)} (${getUTCOffset(
              cardData.createdAtUTC
            )})`}
            icon={calendarNumberOutline}
            testId="creation-timestamp"
            className="creation-timestamp"
            mask={false}
            fullText
          />
        </CardBlock>
      </div>
      {!isMultiSig && cardData.k.length && (
        <>
          <CardBlock
            copyContent={cardData.k[0]}
            flatBorder={FlatBorderType.BOT}
            title={i18n.t(
              "tabs.identifiers.details.identifierdetail.signingkey.title"
            )}
            testId="signingkey-block"
          >
            {cardData.k.map((item, index) => {
              return (
                <CardDetailsItem
                  key={item}
                  info={`${item.substring(0, 5)}...${item.slice(-5)}`}
                  testId={`signing-key-${index}`}
                  icon={keyOutline}
                  mask={false}
                  fullText={false}
                />
              );
            })}
          </CardBlock>
          <CardBlock
            className="rotate-button-container"
            flatBorder={FlatBorderType.TOP}
            testId="rotate-button-block"
          >
            <IonButton
              shape="round"
              className="rotate-keys-button"
              data-testid="rotate-keys-button"
              onClick={onRotateKey}
            >
              <p>
                {i18n.t(
                  "tabs.identifiers.details.identifierdetail.signingkey.rotate"
                )}
              </p>
              <IonIcon icon={refreshOutline} />
            </IonButton>
          </CardBlock>
        </>
      )}
      <CardBlock
        title={i18n.t("tabs.identifiers.details.identifierdetail.showadvanced")}
        onClick={() => openPropDetailModal(DetailView.AdvancedDetail)}
        testId="show-advanced-block"
      />
      {isMultiSig && cardData.kt && (
        <>
          <ListHeader
            title={i18n.t("tabs.identifiers.details.keyrotation.title")}
          />
          <CardBlock
            title={i18n.t(
              "tabs.identifiers.details.keyrotation.rotatesigningkey.title"
            )}
            onClick={() => openPropDetailModal(DetailView.RotationThreshold)}
            testId="rotate-signing-key-block"
          >
            <CardDetailsContent
              testId="rotate-signing-key"
              mainContent={`${cardData.kt}`}
              subContent={`${i18n.t(
                "tabs.identifiers.details.keyrotation.rotatesigningkey.outof",
                { threshold: memberCount }
              )}`}
            />
          </CardBlock>
        </>
      )}
      <IdentifierAttributeDetailModal
        isOpen={openDetailModal}
        setOpen={setOpenDetailModal}
        view={viewType}
        setViewType={setViewType}
        data={cardData}
      />
    </>
  );
};

export { IdentifierContent };
