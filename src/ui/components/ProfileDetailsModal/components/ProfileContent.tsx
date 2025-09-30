import { IonButton, IonCol, IonGrid, IonIcon, IonRow } from "@ionic/react";
import {
  appsOutline,
  calendarNumberOutline,
  keyOutline,
  pencilOutline,
  personCircleOutline,
  refreshOutline,
  shareOutline,
  star,
} from "ionicons/icons";
import { useCallback, useState } from "react";
import { i18n } from "../../../../i18n";
import { useAppSelector } from "../../../../store/hooks";
import {
  getCredsCache,
  getCurrentProfile,
  getMultisigConnectionsCache,
  getPeerConnections,
  getProfiles,
} from "../../../../store/reducers/profileCache";
import {
  formatShortDate,
  formatTimeToSec,
  getUTCOffset,
} from "../../../utils/formatters";
import { Avatar, MemberAvatar } from "../../Avatar";
import { CardDetailsContent } from "../../CardDetails";
import { CardBlock, FlatBorderType } from "../../CardDetails/CardDetailsBlock";
import { CardDetailsItem } from "../../CardDetails/CardDetailsItem";
import { ConnectdApp } from "../../ConnectdApp";
import { EditProfile } from "../../EditProfile";
import { ListHeader } from "../../ListHeader";
import { ShareConnection } from "../../ShareConnection";
import { ListCard } from "../../ListCard/ListCard";
import { ListItem } from "../../ListCard/ListItem";
import { IdentifierAttributeDetailModal } from "./IdentifierAttributeDetailModal/IdentifierAttributeDetailModal";
import { DetailView } from "./IdentifierAttributeDetailModal/IdentifierAttributeDetailModal.types";
import {
  ProfileContentProps,
  ProfileInformationProps,
} from "./ProfileContent.types";
import { combineClassNames } from "../../../utils/style";

const DISPLAY_MEMBERS = 3;

const ProfileInformation = ({ value, text }: ProfileInformationProps) => {
  return (
    <IonCol className="profile-information">
      <p className="profile-information-value">{value}</p>
      <p className="profile-information-text">{text}</p>
    </IonCol>
  );
};

const ProfileContent = ({
  cardData,
  onRotateKey,
  oobi,
  setCardData,
}: ProfileContentProps) => {
  const profiles = useAppSelector(getProfiles);
  const multisignConnectionsCache = useAppSelector(getMultisigConnectionsCache);
  const currentProfile = useAppSelector(getCurrentProfile);
  const credentials = useAppSelector(getCredsCache);
  const peerConnections = useAppSelector(getPeerConnections);
  const credentialsCount = credentials.length;
  const connectionsCount = currentProfile?.connections?.length || 0;
  const dappsCount = peerConnections.length;
  const memberCount = cardData.members?.length || 0;
  const [openDetailModal, setOpenDetailModal] = useState(false);
  const [viewType, setViewType] = useState(DetailView.AdvancedDetail);
  const [shareIsOpen, setShareIsOpen] = useState(false);
  const [editorOptionsIsOpen, setEditorIsOpen] = useState(false);
  const [connectdApp, setConnectdApp] = useState(false);

  const openShareModal = () => {
    if (!cardData) return;
    setShareIsOpen(true);
  };

  const openPropDetailModal = useCallback((view: DetailView) => {
    setViewType(view);
    setOpenDetailModal(true);
  }, []);

  const isMultiSig =
    cardData.groupMemberPre || profiles[cardData.id]?.identity.groupMemberPre;

  const members = cardData.members
    ?.map((member, index) => {
      const memberConnection = multisignConnectionsCache.find(
        (c) => c.id === member
      );
      let name = memberConnection?.label || member;

      if (!memberConnection?.label) {
        name = cardData.groupMetadata?.userName || "";
      }

      const rank = index >= 0 ? index % 5 : 0;

      return {
        name,
        rank,
        isCurrentUser: !memberConnection?.label,
      };
    })
    .slice(0, DISPLAY_MEMBERS);

  const openGroupMember = () => openPropDetailModal(DetailView.GroupMember);
  const showDapp = () => {
    setConnectdApp(true);
  };
  const openEditModal = () => setEditorIsOpen(true);

  return (
    <>
      <div className="profile-info">
        <Avatar id={cardData.id} />
        <IonGrid>
          <IonRow className="profile-info-row">
            <ProfileInformation
              value={`${credentialsCount}`}
              text={i18n.t(
                "profiledetails.identifierdetail.information.credentials"
              )}
            />
            <ProfileInformation
              value={`${connectionsCount}`}
              text={i18n.t(
                "profiledetails.identifierdetail.information.connections"
              )}
            />
            <ProfileInformation
              value={`${dappsCount}`}
              text={i18n.t("profiledetails.identifierdetail.information.dapps")}
            />
          </IonRow>
        </IonGrid>
      </div>
      <div className="profile-details-split-section actions">
        {!isMultiSig && (
          <IonButton
            expand="block"
            shape="round"
            className="profile-button"
            onClick={openEditModal}
            data-testid="edit-button"
          >
            <IonIcon
              slot="icon-only"
              size="small"
              icon={pencilOutline}
              color="primary"
            />
            <span>{i18n.t("profiledetails.options.edit")}</span>
          </IonButton>
        )}
        <IonButton
          expand="block"
          shape="round"
          className={combineClassNames(
            "profile-button",
            isMultiSig ? "full-width" : ""
          )}
          onClick={openShareModal}
          data-testid="share-button"
        >
          <IonIcon
            slot="icon-only"
            size="small"
            icon={shareOutline}
            color="primary"
          />
          <span>{i18n.t("profiledetails.options.share")}</span>
        </IonButton>
      </div>
      {!isMultiSig && (
        <ListCard
          items={[
            {
              label: i18n.t("profiledetails.identifierdetail.listoptions.dapp"),
              icon: appsOutline,
              onClick: showDapp,
            },
          ]}
          renderItem={(item, index) => (
            <ListItem
              key={index}
              icon={item.icon}
              label={item.label}
              onClick={item.onClick}
              testId={`profiledetails-list-option-${index}`}
              className="list-item"
              showStartIcon={true}
            />
          )}
        />
      )}
      {isMultiSig && members && (
        <>
          <ListHeader title={i18n.t("profiledetails.group.title")} />
          {members && (
            <>
              <CardBlock
                onClick={openGroupMember}
                title={i18n.t("profiledetails.group.groupmembers.title")}
                testId="group-member-block"
                className="group-members"
                flatBorder={FlatBorderType.BOT}
              >
                {members.map((item, index) => {
                  return (
                    <CardDetailsItem
                      key={index}
                      info={item.name}
                      startSlot={
                        <MemberAvatar
                          firstLetter={
                            item.name.at(0)?.toLocaleUpperCase() || ""
                          }
                          rank={item.rank}
                        />
                      }
                      className="member"
                      testId={`group-member-${index}`}
                      endSlot={
                        item.isCurrentUser && (
                          <div className="user-label">
                            <IonIcon icon={star} />
                            <span>
                              {i18n.t("profiledetails.detailsmodal.you")}
                            </span>
                          </div>
                        )
                      }
                    />
                  );
                })}
                {members.length < memberCount && (
                  <IonButton
                    className="view-more-members"
                    onClick={() => openPropDetailModal(DetailView.GroupMember)}
                    data-testid="view-member"
                  >
                    {i18n.t("profiledetails.group.button.viewmore", {
                      remainMembers: memberCount - DISPLAY_MEMBERS,
                    })}
                  </IonButton>
                )}
              </CardBlock>
              <CardBlock
                className="edit-username-button-container"
                flatBorder={FlatBorderType.TOP}
                testId="edit-username-button-block"
              >
                <IonButton
                  shape="round"
                  className="edit-username-button"
                  data-testid="edit-username-button"
                  onClick={openEditModal}
                >
                  <p>{i18n.t("profiledetails.group.groupmembers.editname")}</p>
                  <IonIcon icon={pencilOutline} />
                </IonButton>
              </CardBlock>
            </>
          )}
          {cardData.kt && (
            <CardBlock
              title={i18n.t("profiledetails.group.signingkeysthreshold.title")}
              onClick={() => openPropDetailModal(DetailView.SigningThreshold)}
              testId="signing-threshold-block"
            >
              <CardDetailsContent
                mainContent={`${i18n.t(
                  "profiledetails.group.signingkeysthreshold.member",
                  { member: cardData.kt }
                )}`}
                subContent={`${i18n.t(
                  "profiledetails.group.signingkeysthreshold.outof",
                  { threshold: memberCount }
                )}`}
                testId="signing-threshold-content"
              />
            </CardBlock>
          )}
          {cardData.nt && (
            <CardBlock
              title={i18n.t("profiledetails.group.rotationthreshold.title")}
              onClick={() => openPropDetailModal(DetailView.RotationThreshold)}
              testId="rotate-threshold-block"
            >
              <CardDetailsContent
                mainContent={`${i18n.t(
                  "profiledetails.group.rotationthreshold.member",
                  { member: cardData.nt }
                )}`}
                subContent={`${i18n.t(
                  "profiledetails.group.rotationthreshold.outof",
                  { threshold: memberCount }
                )}`}
                testId="rotate-threshold-content"
              />
            </CardBlock>
          )}
        </>
      )}
      <ListHeader title={i18n.t("profiledetails.identifierdetail.title")} />
      <div className="profile-details-split-section">
        <CardBlock
          copyContent={cardData.id}
          title={i18n.t("profiledetails.identifierdetail.identifierid.title")}
          testId="identifier-id-block"
        >
          <CardDetailsItem
            info={`${cardData.id.substring(0, 5)}...${cardData.id.slice(-5)}`}
            icon={personCircleOutline}
            testId="identifier-id"
            className="identifier-id"
            mask={false}
          />
        </CardBlock>
        <CardBlock
          title={i18n.t("profiledetails.identifierdetail.created.title")}
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
      {cardData.k.length && (
        <>
          <CardBlock
            copyContent={cardData.k[0]}
            flatBorder={!isMultiSig ? FlatBorderType.BOT : undefined}
            title={i18n.t("profiledetails.identifierdetail.signingkey.title")}
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
          {!isMultiSig && (
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
                  {i18n.t("profiledetails.identifierdetail.signingkey.rotate")}
                </p>
                <IonIcon icon={refreshOutline} />
              </IonButton>
            </CardBlock>
          )}
        </>
      )}
      <ListCard
        className="show-advance"
        items={[
          {
            label: i18n.t("profiledetails.identifierdetail.showadvanced"),
            icon: appsOutline,
            onClick: () =>
              isMultiSig
                ? undefined
                : openPropDetailModal(DetailView.AdvancedDetail),
          },
        ]}
        renderItem={(item, index) => (
          <ListItem
            key={index}
            icon={item.icon}
            label={item.label}
            onClick={item.onClick}
            testId="show-advanced-block"
            className="list-item"
          />
        )}
      />
      <IdentifierAttributeDetailModal
        isOpen={openDetailModal}
        setOpen={setOpenDetailModal}
        view={viewType}
        setViewType={setViewType}
        data={cardData}
        openEdit={openEditModal}
      />
      <ShareConnection
        isOpen={shareIsOpen}
        setIsOpen={setShareIsOpen}
        oobi={oobi}
      />
      <EditProfile
        modalIsOpen={editorOptionsIsOpen}
        setModalIsOpen={setEditorIsOpen}
        setCardData={setCardData}
        cardData={cardData}
      />
      <ConnectdApp
        isOpen={connectdApp}
        setIsOpen={setConnectdApp}
      />
    </>
  );
};

export { ProfileContent };
