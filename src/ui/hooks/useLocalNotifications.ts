import { useEffect, useCallback } from "react";
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import {
  getCurrentProfile,
  setCurrentProfile,
  getProfiles,
} from "../../store/reducers/profileCache";
import { setToastMsg } from "../../store/reducers/stateCache";
import { notificationService } from "../../native/pushNotifications/notificationService";
import { KeriaNotification } from "../../core/agent/services/keriaNotificationService.types";
import { ToastMsgType } from "../globals/types";

export const useLocalNotifications = () => {
  const allProfiles = useAppSelector(getProfiles);
  const currentProfile = useAppSelector(getCurrentProfile);
  const dispatch = useAppDispatch();

  const currentProfileId = currentProfile?.identity.id || "";
  const NOTIFICATION_PROCESS_DELAY_MS = 100;

  const displayNotification = useCallback(
    (notification: KeriaNotification) => {
      if (!allProfiles) {
        return;
      }

      const notificationProfile = Object.values(allProfiles).find(
        (profile) => profile.identity?.id === notification.receivingPre
      );

      if (notificationProfile) {
        const profileConnections = notificationProfile.connections || [];
        const profileMultisigConnections =
          notificationProfile.multisigConnections || [];

        notificationService.showLocalNotification(
          notification,
          currentProfileId,
          notificationProfile.identity.displayName,
          {
            connectionsCache: profileConnections,
            multisigConnectionsCache: profileMultisigConnections,
          }
        );
      }
    },
    [allProfiles, currentProfileId]
  );

  const cleanupShownNotifications = useCallback(async () => {
    const allCurrentNotificationIds: string[] = [];
    if (allProfiles) {
      Object.values(allProfiles).forEach((profile) => {
        if (profile.notifications) {
          profile.notifications.forEach((notification) => {
            allCurrentNotificationIds.push(notification.id);
          });
        }
      });
    }

    await notificationService.cleanupShownNotifications(
      allCurrentNotificationIds
    );
  }, [allProfiles]);

  const getUnreadNotificationsFromOtherProfiles =
    useCallback((): KeriaNotification[] => {
      const unreadNotifications: KeriaNotification[] = [];

      if (allProfiles && currentProfile) {
        Object.values(allProfiles).forEach((profile) => {
          if (
            profile.identity?.id !== currentProfile.identity?.id &&
            profile.notifications
          ) {
            const unreadFromProfile = profile.notifications.filter(
              (notification) => !notification.read
            );
            unreadNotifications.push(...unreadFromProfile);
          }
        });
      }

      return unreadNotifications;
    }, [allProfiles, currentProfile]);

  useEffect(() => {
    notificationService.setProfileSwitcher((profileId: string) => {
      dispatch(setCurrentProfile(profileId));
      dispatch(setToastMsg(ToastMsgType.PROFILE_SWITCHED));
      notificationService.clearDeliveredNotificationsForProfile(profileId);
    });

    notificationService.setNavigator(
      (path: string, notificationId?: string) => {
        if (notificationId) {
          notificationService.markAsShown(notificationId);
        }
        window.history.pushState(null, "", path);
        window.dispatchEvent(
          new CustomEvent("notificationNavigation", { detail: { path } })
        );
      }
    );
  }, [dispatch]);

  useEffect(() => {
    const processNotifications = async () => {
      if (
        !currentProfile ||
        !allProfiles ||
        !allProfiles[currentProfile.identity.id]
      ) {
        return;
      }

      const hasPendingColdStart = notificationService.hasPendingColdStart();

      if (hasPendingColdStart) {
        const targetProfileId =
          notificationService.getTargetProfileIdForColdStart();
        if (targetProfileId && currentProfile.identity.id !== targetProfileId) {
          return;
        }
      }

      if (notificationService.isProfileSwitchInProgress()) {
        const targetProfileId =
          notificationService.getTargetProfileIdForWarmSwitch();
        const currentProfileIdValue = currentProfile?.identity?.id;

        if (
          targetProfileId &&
          currentProfileIdValue &&
          currentProfileIdValue === targetProfileId
        ) {
          notificationService.setProfileSwitchComplete();
        } else if (!targetProfileId) {
          notificationService.setProfileSwitchComplete();
        } else {
          return;
        }
      }

      if (currentProfile && allProfiles[currentProfile.identity.id]) {
        const currentProfileNotifications =
          allProfiles[currentProfile.identity.id].notifications || [];
        for (const notification of currentProfileNotifications) {
          const isAlreadyShown = await notificationService.isNotificationShown(
            notification.id
          );
          if (!isAlreadyShown) {
            await notificationService.markAsShown(notification.id);
          }
        }
      }

      const allUnreadNotifications = getUnreadNotificationsFromOtherProfiles();

      for (const notification of allUnreadNotifications) {
        const isAlreadyShown = await notificationService.isNotificationShown(
          notification.id
        );
        if (!isAlreadyShown) {
          displayNotification(notification);
        }
      }

      await cleanupShownNotifications();
      if (notificationService.isProfileSwitchInProgress()) {
        notificationService.setProfileSwitchComplete();
      }
    };

    const timeoutId = setTimeout(() => {
      processNotifications();
    }, NOTIFICATION_PROCESS_DELAY_MS);

    return () => clearTimeout(timeoutId);
  }, [
    allProfiles,
    currentProfile,
    displayNotification,
    getUnreadNotificationsFromOtherProfiles,
    cleanupShownNotifications,
  ]);
};
