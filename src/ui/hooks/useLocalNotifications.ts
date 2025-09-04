import { useEffect, useRef } from "react";
import { useAppSelector } from "../../store/hooks";
import { getNotificationsCache } from "../../store/reducers/profileCache";
import { useNotificationService } from "../../core/services/notificationService";
import { KeriaNotification } from "../../core/agent/services/keriaNotificationService.types";

export const useLocalNotifications = () => {
  const notifications = useAppSelector(getNotificationsCache);
  const notificationService = useNotificationService();
  const shownNotificationsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Show local notifications for newly unread notifications
    const unreadNotifications = notifications.filter(
      (notification) =>
        !notification.read &&
        !shownNotificationsRef.current.has(notification.id)
    );

    unreadNotifications.forEach((notification) => {
      notificationService.showLocalNotification(notification);
      shownNotificationsRef.current.add(notification.id);
    });

    // Clean up shown notifications that are no longer in the cache
    const currentNotificationIds = new Set(notifications.map((n) => n.id));
    shownNotificationsRef.current.forEach((id) => {
      if (!currentNotificationIds.has(id)) {
        shownNotificationsRef.current.delete(id);
      }
    });
  }, [notifications, notificationService]);

  return {
    showNotification: (notification: KeriaNotification) => {
      if (!shownNotificationsRef.current.has(notification.id)) {
        notificationService.showLocalNotification(notification);
        shownNotificationsRef.current.add(notification.id);
      }
    },
    requestPermissions: () => notificationService.requestPermissions(),
  };
};
