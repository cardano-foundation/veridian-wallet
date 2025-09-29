import { IonModal } from "@ionic/react";
import { i18n } from "../../../../../i18n";
import { useAppSelector } from "../../../../../store/hooks";
import { getMultisigConnectionsCache } from "../../../../../store/reducers/profileCache";
import { MemberAvatar } from "../../../Avatar";
import { InfoCard } from "../../../InfoCard";
import { ScrollablePageLayout } from "../../../layout/ScrollablePageLayout";
import { PageHeader } from "../../../PageHeader";
import { Advanced } from "./Advanced";
import "./IdentifierAttributeDetailModal.scss";
import {
  DetailView,
  IdentifierAttributeDetailModalProps,
} from "./IdentifierAttributeDetailModal.types";
import { List } from "./List";
import { RotationThreshold } from "./RotationThreshold";
import { SigningThreshold } from "./SigningThreshold";

const IdentifierAttributeDetailModal = ({
  isOpen,
  setOpen,
  view,
  data,
  setViewType,
  openEdit,
}: IdentifierAttributeDetailModalProps) => {
  const multisignConnectionsCache = useAppSelector(getMultisigConnectionsCache);

  const handleClose = () => {
    setOpen(false);
  };

  const renderContent = () => {
    let currentUserIndex = 0;
    const members = data.members?.map((member, index) => {
      const memberConnection = multisignConnectionsCache.find(
        (c) => c.id === member
      );
      let name = memberConnection?.label || member;

      if (!memberConnection?.label) {
        currentUserIndex = index;
        name = data.groupMetadata?.userName || "";
      }

      const rank = index >= 0 ? index % 5 : 0;

      return {
        title: name,
        isCurrentUser: !memberConnection?.label,
        avatar: (
          <MemberAvatar
            firstLetter={name.at(0)?.toLocaleUpperCase() || ""}
            rank={rank}
          />
        ),
      };
    });

    switch (view) {
      case DetailView.SigningThreshold:
        return (
          <SigningThreshold
            data={data}
            setViewType={setViewType}
          />
        );
      case DetailView.RotationThreshold:
        return (
          <RotationThreshold
            data={data}
            setViewType={setViewType}
          />
        );
      case DetailView.GroupMember: {
        return (
          <List
            bottomText={`${i18n.t(
              `profiledetails.detailsmodal.${view}.bottomtext`,
              { members: members?.length || 0 }
            )}`}
            title={`${i18n.t(`profiledetails.detailsmodal.${view}.title`)}`}
            data={members || []}
            onButtonClick={openEdit}
            mask
          />
        );
      }
      default:
        return (
          <Advanced
            currentUserIndex={currentUserIndex}
            data={data}
          />
        );
    }
  };

  return (
    <>
      <IonModal
        isOpen={isOpen}
        className="identifier-detail-modal"
        data-testid="identifier-detail-modal"
      >
        <ScrollablePageLayout
          pageId={view}
          header={
            <PageHeader
              title={`${i18n.t(`profiledetails.detailsmodal.${view}.title`)}`}
              closeButton
              closeButtonLabel={`${i18n.t(
                "profiledetails.detailsmodal.button.done"
              )}`}
              closeButtonAction={handleClose}
            />
          }
        >
          <div className="attribute-description">
            <h3>
              {i18n.t(`profiledetails.detailsmodal.${view}.propexplain.title`)}
            </h3>
          </div>
          <InfoCard
            className="attribute-description-content"
            content={i18n.t(
              `profiledetails.detailsmodal.${view}.propexplain.content`
            )}
          />
          {renderContent()}
        </ScrollablePageLayout>
      </IonModal>
    </>
  );
};

export { IdentifierAttributeDetailModal };
