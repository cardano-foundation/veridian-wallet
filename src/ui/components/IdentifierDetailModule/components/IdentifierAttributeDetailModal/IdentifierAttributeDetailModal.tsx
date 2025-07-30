import { IonModal } from "@ionic/react";
import { i18n } from "../../../../../i18n";
import { useAppSelector } from "../../../../../store/hooks";
import { getMultisigConnectionsCache } from "../../../../../store/reducers/connectionsCache";
import { getAuthentication } from "../../../../../store/reducers/stateCache";
import { InfoCard } from "../../../../components/InfoCard";
import { ScrollablePageLayout } from "../../../../components/layout/ScrollablePageLayout";
import { PageHeader } from "../../../../components/PageHeader";
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
}: IdentifierAttributeDetailModalProps) => {
  const userName = useAppSelector(getAuthentication)?.userName;
  const multisignConnectionsCache = useAppSelector(getMultisigConnectionsCache);

  const handleClose = () => {
    setOpen(false);
  };

  const renderContent = () => {
    let currentUserIndex = 0;
    const members = data.members?.map((member, index) => {
      const memberConnection = multisignConnectionsCache[member];
      let name = memberConnection?.label || member;

      if (!memberConnection?.label) {
        currentUserIndex = index;
        name = userName;
      }

      return {
        title: name,
        isCurrentUser: !memberConnection?.label,
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
              `tabs.identifiers.details.detailmodal.${view}.bottomtext`,
              { members: members?.length || 0 }
            )}`}
            title={`${i18n.t(
              `tabs.identifiers.details.detailmodal.${view}.title`
            )}`}
            data={members || []}
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
              title={`${i18n.t(
                `tabs.identifiers.details.detailmodal.${view}.title`
              )}`}
              closeButton
              closeButtonLabel={`${i18n.t(
                "tabs.identifiers.details.detailmodal.button.done"
              )}`}
              closeButtonAction={handleClose}
            />
          }
        >
          <div className="attribute-description">
            <h3>
              {i18n.t(
                `tabs.identifiers.details.detailmodal.${view}.propexplain.title`
              )}
            </h3>
          </div>
          <InfoCard
            className="attribute-description-content"
            content={i18n.t(
              `tabs.identifiers.details.detailmodal.${view}.propexplain.content`
            )}
          />
          {renderContent()}
        </ScrollablePageLayout>
      </IonModal>
    </>
  );
};

export { IdentifierAttributeDetailModal };
