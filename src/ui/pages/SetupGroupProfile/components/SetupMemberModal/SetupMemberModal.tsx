import { IonCheckbox, IonModal } from "@ionic/react";
import { useEffect, useMemo, useState } from "react";
import { ConnectionShortDetails } from "../../../../../core/agent/agent.types";
import { i18n } from "../../../../../i18n";
import { MemberAvatar } from "../../../../components/Avatar";
import { CardItem, CardList } from "../../../../components/CardList";
import { ScrollablePageLayout } from "../../../../components/layout/ScrollablePageLayout";
import { PageFooter } from "../../../../components/PageFooter";
import { PageHeader } from "../../../../components/PageHeader";
import "./SetupMemberModal.scss";
import { SetupMemberModalProps } from "./SetupMemberModal.types";

export const SetupMemberModal = ({
  isOpen,
  connections,
  currentSelectedConnections,
  setOpen,
  onSubmit,
}: SetupMemberModalProps) => {
  const [data, setData] = useState<ConnectionShortDetails[]>([
    ...currentSelectedConnections,
  ]);

  useEffect(() => {
    if (isOpen) setData([...currentSelectedConnections]);
  }, [currentSelectedConnections, isOpen]);

  const handleClose = () => {
    setOpen(false);
  };

  const handleSubmit = () => {
    onSubmit(data);
    handleClose();
  };

  const displayConnections = useMemo(() => {
    return connections.map(
      (connection): CardItem<ConnectionShortDetails> => ({
        id: connection.id,
        title: connection.label,
        data: connection,
      })
    );
  }, [connections]);

  const handleSelectConnection = (data: ConnectionShortDetails) => {
    setData((values) => {
      if (values.some((item) => item.id === data.id))
        return values.filter((item) => item.id !== data.id);

      return [...values, data];
    });
  };

  return (
    <IonModal
      isOpen={isOpen}
      className="setup-connections-modal"
      data-testid="setup-connections-modal"
      onDidDismiss={handleClose}
    >
      <ScrollablePageLayout
        pageId="setup-connections-modal-content"
        header={
          <PageHeader
            closeButton={true}
            closeButtonLabel={`${i18n.t(
              "setupgroupprofile.initgroup.setconnections.button.back"
            )}`}
            closeButtonAction={handleClose}
            title={`${i18n.t(
              "setupgroupprofile.initgroup.setconnections.title"
            )}`}
          />
        }
        footer={
          <PageFooter
            pageId="setup-connections-modal"
            primaryButtonText={`${i18n.t(
              "setupgroupprofile.initgroup.setconnections.button.confirm"
            )}`}
            primaryButtonAction={handleSubmit}
            primaryButtonDisabled={data.length === 0}
          />
        }
      >
        <p className="header-text">
          {i18n.t("setupgroupprofile.initgroup.setconnections.text")}
        </p>
        <CardList
          className="member-list"
          data={displayConnections}
          hiddenImage
          onCardClick={(data, e) => {
            e.stopPropagation();
            handleSelectConnection(data);
          }}
          onRenderStartSlot={(connection, index) => {
            return (
              <MemberAvatar
                rank={index % 5}
                firstLetter={connection.label[0] || ""}
              />
            );
          }}
          onRenderEndSlot={(connection) => {
            return (
              <IonCheckbox
                checked={data.some(
                  (checkedConenction) => checkedConenction.id === connection.id
                )}
                aria-label=""
                className="checkbox"
                data-testid={`connection-select-${connection.id}`}
              />
            );
          }}
        />
      </ScrollablePageLayout>
    </IonModal>
  );
};
