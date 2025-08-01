import {
  mailOpenOutline,
  mailUnreadOutline,
  readerOutline,
  trashOutline,
} from "ionicons/icons";
import { useState } from "react";
import { Agent } from "../../../../core/agent/agent";
import { NotificationRoute } from "../../../../core/agent/services/keriaNotificationService.types";
import { i18n } from "../../../../i18n";
import { useAppDispatch } from "../../../../store/hooks";
import {
  deleteNotificationById,
  markNotificationAsRead,
} from "../../../../store/reducers/profileCache";
import { Alert } from "../../../components/Alert";
import { OptionItem, OptionModal } from "../../../components/OptionsModal";
import { showError } from "../../../utils/error";
import { NotificationOptionModalProps } from "./NotificationOptionsModal.types";

const NotificationOptionsModal = ({
  optionsIsOpen,
  setCloseModal,
  notification,
  onShowDetail,
}: NotificationOptionModalProps) => {
  const dispatch = useAppDispatch();
  const [openAlert, setOpenAlert] = useState(false);

  const closeModal = () => {
    setCloseModal();
  };

  const toggleReadNotification = async () => {
    try {
      if (notification.read) {
        await Agent.agent.keriaNotifications.unreadNotification(
          notification.id
        );
      } else {
        await Agent.agent.keriaNotifications.readNotification(notification.id);
      }

      dispatch(
        markNotificationAsRead({
          id: notification.id,
          read: !notification.read,
        })
      );
      closeModal();
    } catch (e) {
      showError("Unable to change notification status", e, dispatch);
    }
  };

  const removeNotification = async () => {
    try {
      await Agent.agent.keriaNotifications.deleteNotificationRecordById(
        notification.id,
        notification.a.r as NotificationRoute
      );
      dispatch(deleteNotificationById(notification.id));
      closeModal();
    } catch (e) {
      showError("Unable to remove notification", e, dispatch);
    }
  };

  const deleteNotificationClick = () => {
    setOpenAlert(true);
  };

  const options: OptionItem[] = [
    {
      icon: readerOutline,
      label: i18n.t("tabs.notifications.tab.optionmodal.showdetail"),
      onClick: () => {
        onShowDetail(notification);
        closeModal();
      },
      testId: "show-notification-detail",
    },
    {
      icon: notification.read ? mailUnreadOutline : mailOpenOutline,
      label: i18n.t(
        notification.read
          ? "tabs.notifications.tab.optionmodal.markasunread"
          : "tabs.notifications.tab.optionmodal.markasread"
      ),
      onClick: toggleReadNotification,
      testId: "toogle-read-notification",
    },
    {
      icon: trashOutline,
      label: i18n.t("tabs.notifications.tab.optionmodal.delete"),
      onClick: deleteNotificationClick,
      testId: "delete-notification",
    },
  ];

  return (
    <>
      <OptionModal
        modalIsOpen={optionsIsOpen}
        componentId="notification-options-modal"
        onDismiss={closeModal}
        header={{
          closeButton: true,
          closeButtonLabel: `${i18n.t(
            "tabs.notifications.tab.optionmodal.done"
          )}`,
          closeButtonAction: closeModal,
          title: `${i18n.t("tabs.notifications.tab.optionmodal.title")}`,
        }}
        items={options}
      />
      <Alert
        isOpen={openAlert}
        setIsOpen={setOpenAlert}
        dataTestId="alert-delete-notification"
        headerText={i18n.t(
          "tabs.notifications.tab.optionmodal.deletealert.text"
        )}
        confirmButtonText={`${i18n.t(
          "tabs.notifications.tab.optionmodal.deletealert.accept"
        )}`}
        cancelButtonText={`${i18n.t(
          "tabs.notifications.tab.optionmodal.deletealert.cancel"
        )}`}
        actionCancel={() => setOpenAlert(false)}
        actionConfirm={removeNotification}
        actionDismiss={() => setOpenAlert(false)}
      />
    </>
  );
};

export { NotificationOptionsModal };
