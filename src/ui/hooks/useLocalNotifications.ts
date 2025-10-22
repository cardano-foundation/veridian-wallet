import { useEffect, useCallback } from "react";
import { useAppIonRouter } from "./appIonRouterHook";
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import {
  getCurrentProfile,
  setCurrentProfile,
  getProfiles,
} from "../../store/reducers/profileCache";
import { setToastMsg } from "../../store/reducers/stateCache";
import { notificationService } from "../../core/services/notificationService";
import { KeriaNotification } from "../../core/agent/services/keriaNotificationService.types";
import { ToastMsgType } from "../globals/types";

export const useLocalNotifications = () => {
  const allProfiles = useAppSelector(getProfiles);
  const currentProfile = useAppSelector(getCurrentProfile);
  const dispatch = useAppDispatch();
  const ionRouter = useAppIonRouter();

  const currentProfileId = currentProfile?.identity.id || "";

  const displayNotification = useCallback(
    (notification: KeriaNotification) => {
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
    });

    notificationService.setNavigator((path: string) => {
      window.history.pushState(null, "", path);
      window.dispatchEvent(
        new CustomEvent("notificationNavigation", { detail: { path } })
      );
    });
  }, [dispatch, ionRouter]);

  useEffect(() => {
    const processNotifications = async () => {
      if (notificationService.hasPendingColdStart()) {
        return;
      }

      const allUnreadNotifications = getUnreadNotificationsFromOtherProfiles();

      allUnreadNotifications.forEach((notification) => {
        displayNotification(notification);
      });

      await cleanupShownNotifications();
    };

    processNotifications();
  }, [
    allProfiles,
    currentProfile,
    displayNotification,
    getUnreadNotificationsFromOtherProfiles,
    cleanupShownNotifications,
  ]);

  return {
    showNotification: (notification: KeriaNotification) => {
      displayNotification(notification);
    },
    requestPermissions: () => notificationService.requestPermissions(),
  };
};
