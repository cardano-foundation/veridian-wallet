import { IonList, useIonViewWillEnter } from "@ionic/react";
import { useEffect, useRef, useState } from "react";
import { useHistory } from "react-router-dom";
import { Agent } from "../../../core/agent/agent";
import {
  KeriaNotification,
  NotificationRoute,
} from "../../../core/agent/services/keriaNotificationService.types";
import { i18n } from "../../../i18n";
import { TabsRoutePath } from "../../../routes/paths";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import { getConnectionsCache } from "../../../store/reducers/connectionsCache";
import {
  getNotificationsCache,
  markNotificationAsRead,
} from "../../../store/reducers/notificationsCache";
import { setCurrentRoute } from "../../../store/reducers/stateCache";
import { Alert } from "../../components/Alert";
import { CredentialDetailModal } from "../../components/CredentialDetailModule";
import { FilterChip } from "../../components/FilterChip/FilterChip";
import { AllowedChipFilter } from "../../components/FilterChip/FilterChip.types";
import { TabLayout } from "../../components/layout/TabLayout";
import { showError } from "../../utils/error";
import { timeDifference } from "../../utils/formatters";
import { IdentifiersFilters } from "../Identifiers/Identifiers.types";
import { NotificationFilters } from "./Notification.types";
import { NotificationItem } from "./NotificationItem";
import "./Notifications.scss";
import { EarlierNotification } from "./components";
import { EarlierNotificationRef } from "./components/EarlierNotification.types";
import { NotificationOptionsModal } from "./components/NotificationOptionsModal";

const Notifications = () => {
  const pageId = "notifications-tab";
  const dispatch = useAppDispatch();
  const history = useHistory();
  const connectionsCache = useAppSelector(getConnectionsCache);
  const notificationsCache = useAppSelector(getNotificationsCache);
  const notifications = [...notificationsCache].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const [selectedFilter, setSelectedFilter] = useState<
    NotificationFilters | IdentifiersFilters
  >(NotificationFilters.All);
  const earlierNotificationRef = useRef<EarlierNotificationRef>(null);
  const [selectedItem, setSelectedItem] = useState<KeriaNotification | null>(
    null
  );
  const [isOpenCredModal, setIsOpenCredModal] = useState(false);
  const [viewCred, setViewCred] = useState("");
  const [openUnknownConnectionAlert, setOpenUnknownConnectionAlert] =
    useState(false);
  const [
    openUnknownPresentConnectionAlert,
    setOpenUnknownPresentConnectionAlert,
  ] = useState(false);

  const filteredNotification = (() => {
    if (selectedFilter === NotificationFilters.All) {
      return notifications;
    }

    if (selectedFilter === NotificationFilters.Identifier) {
      return notifications.filter(
        (notification) => notification.a.r === NotificationRoute.MultiSigIcp
      );
    }

    return notifications.filter((notification) =>
      [
        NotificationRoute.ExnIpexGrant,
        NotificationRoute.ExnIpexApply,
        NotificationRoute.LocalAcdcRevoked,
      ].includes(notification.a.r as NotificationRoute)
    );
  })();

  const notificationsNew = filteredNotification.filter(
    (notification) =>
      timeDifference(notification.createdAt)[1] === "m" ||
      timeDifference(notification.createdAt)[1] === "h"
  );

  const notificationsEarlier = filteredNotification.filter(
    (notification) =>
      timeDifference(notification.createdAt)[1] !== "h" &&
      timeDifference(notification.createdAt)[1] !== "m"
  );

  useIonViewWillEnter(() => {
    dispatch(setCurrentRoute({ path: TabsRoutePath.NOTIFICATIONS }));
  });

  const maskAsReaded = async (notification: KeriaNotification) => {
    if (notification.read) return;

    try {
      await Agent.agent.keriaNotifications.readNotification(notification.id);

      dispatch(
        markNotificationAsRead({
          id: notification.id,
          read: !notification.read,
        })
      );
    } catch (e) {
      showError("Unable to change notification status", e, dispatch);
    }
  };

  const handleNotificationClick = async (item: KeriaNotification) => {
    await maskAsReaded(item);

    if (
      item.a.r === NotificationRoute.ExnIpexApply &&
      !connectionsCache[item.connectionId]?.label
    ) {
      setOpenUnknownPresentConnectionAlert(true);
      return;
    }

    if (
      item.a.r === NotificationRoute.ExnIpexGrant &&
      !connectionsCache?.[item.connectionId]?.label
    ) {
      setOpenUnknownConnectionAlert(true);
      return;
    }

    if (item.a.r === NotificationRoute.LocalAcdcRevoked) {
      setIsOpenCredModal(true);
      setViewCred(`${item.a.credentialId}`);
      return;
    }

    const path = `${TabsRoutePath.NOTIFICATIONS}/${item.id}`;

    history.push(path);
  };

  const filterOptions = [
    {
      filter: NotificationFilters.All,
      label: i18n.t("tabs.notifications.tab.chips.all"),
    },
    {
      filter: NotificationFilters.Identifier,
      label: i18n.t("tabs.notifications.tab.chips.identifiers"),
    },
    {
      filter: NotificationFilters.Credential,
      label: i18n.t("tabs.notifications.tab.chips.credentials"),
    },
  ];

  const handleSelectFilter = (filter: AllowedChipFilter) => {
    setSelectedFilter(filter as NotificationFilters);
    earlierNotificationRef.current?.reset();
  };

  const onOpenOptionModal = (item: KeriaNotification | null) => {
    setSelectedItem(item);
  };

  useEffect(() => {
    if (history.location.pathname !== TabsRoutePath.NOTIFICATIONS)
      earlierNotificationRef.current?.reset();
  }, [history.location.pathname]);

  const handleHideCardDetails = () => {
    setViewCred("");
    setIsOpenCredModal(false);
  };

  const closeUnknownConnection = () => {
    setOpenUnknownConnectionAlert(false);
  };

  const closeUnknownPresentConnection = () => {
    setOpenUnknownPresentConnectionAlert(false);
  };

  return (
    <>
      <TabLayout
        pageId={pageId}
        header={true}
        title={`${i18n.t("tabs.notifications.tab.header")}`}
      >
        <div className="notifications-tab-chips">
          {filterOptions.map((option) => (
            <FilterChip
              key={option.filter}
              filter={option.filter}
              label={option.label}
              isActive={option.filter === selectedFilter}
              onClick={handleSelectFilter}
            />
          ))}
        </div>
        <div className="notifications-tab-content">
          {!!notificationsNew.length && (
            <div
              className="notifications-tab-section"
              data-testid="notifications-tab-section-new"
            >
              <h3 className="notifications-tab-section-title">
                {i18n.t("tabs.notifications.tab.sections.new")}
              </h3>
              <IonList
                lines="none"
                data-testid="notifications-items"
              >
                {notificationsNew.map((item: KeriaNotification) => (
                  <NotificationItem
                    key={item.id}
                    item={item}
                    onClick={handleNotificationClick}
                    onOptionButtonClick={onOpenOptionModal}
                  />
                ))}
              </IonList>
            </div>
          )}
          <EarlierNotification
            pageId={pageId}
            ref={earlierNotificationRef}
            data={notificationsEarlier}
            onNotificationClick={handleNotificationClick}
            onOpenOptionModal={onOpenOptionModal}
          />
          <p className="notification-empty">
            {filteredNotification.length === 0
              ? i18n.t("tabs.notifications.tab.empty")
              : i18n.t("tabs.notifications.tab.sections.earlier.end")}
          </p>
        </div>
        {selectedItem && (
          <NotificationOptionsModal
            notification={selectedItem}
            onShowDetail={handleNotificationClick}
            optionsIsOpen={!!selectedItem}
            setCloseModal={() => onOpenOptionModal(null)}
          />
        )}
      </TabLayout>
      <CredentialDetailModal
        pageId="revoke-credential"
        isOpen={isOpenCredModal}
        setIsOpen={setIsOpenCredModal}
        onClose={handleHideCardDetails}
        id={viewCred}
      />
      <Alert
        isOpen={openUnknownConnectionAlert}
        setIsOpen={setOpenUnknownConnectionAlert}
        dataTestId="alert-unknown-issuer"
        headerText={i18n.t("tabs.notifications.tab.unknownissuer.text")}
        confirmButtonText={`${i18n.t(
          "tabs.notifications.tab.unknownissuer.button"
        )}`}
        actionConfirm={closeUnknownConnection}
        actionDismiss={closeUnknownConnection}
      />
      <Alert
        isOpen={openUnknownPresentConnectionAlert}
        setIsOpen={setOpenUnknownPresentConnectionAlert}
        dataTestId="alert-unknown-request"
        headerText={i18n.t("tabs.notifications.tab.unknownrequest.text")}
        confirmButtonText={`${i18n.t(
          "tabs.notifications.tab.unknownrequest.button"
        )}`}
        actionConfirm={closeUnknownPresentConnection}
        actionDismiss={closeUnknownPresentConnection}
      />
    </>
  );
};

export { Notifications };
