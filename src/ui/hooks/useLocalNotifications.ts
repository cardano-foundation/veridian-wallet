import { useEffect, useRef, useCallback } from "react";
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
  const shownNotificationsRef = useRef<Set<string>>(new Set());

  const currentProfileId = currentProfile?.identity.id || "";

  const displayNotification = useCallback(
    (notification: KeriaNotification) => {
      const notificationProfile = Object.values(allProfiles).find(
        (profile) => profile.identity?.id === notification.receivingPre
      );

      if (notificationProfile) {
        notificationService.showLocalNotification(
          notification,
          currentProfileId,
          notificationProfile.identity.displayName
        );
        shownNotificationsRef.current.add(notification.id);
      }
    },
    [allProfiles, currentProfileId]
  );

  const cleanupShownNotifications = useCallback(() => {
    const allCurrentNotificationIds = new Set<string>();
    if (allProfiles) {
      Object.values(allProfiles).forEach((profile) => {
        if (profile.notifications) {
          profile.notifications.forEach((notification) => {
            allCurrentNotificationIds.add(notification.id);
          });
        }
      });
    }

    shownNotificationsRef.current.forEach((id) => {
      if (!allCurrentNotificationIds.has(id)) {
        shownNotificationsRef.current.delete(id);
      }
    });
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
              (notification) =>
                !notification.read &&
                !shownNotificationsRef.current.has(notification.id)
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
    const allUnreadNotifications = getUnreadNotificationsFromOtherProfiles();

    allUnreadNotifications.forEach((notification) => {
      displayNotification(notification);
    });

    cleanupShownNotifications();
  }, [
    allProfiles,
    currentProfile,
    displayNotification,
    getUnreadNotificationsFromOtherProfiles,
    cleanupShownNotifications,
  ]);

  return {
    showNotification: (notification: KeriaNotification) => {
      if (!shownNotificationsRef.current.has(notification.id)) {
        displayNotification(notification);
      }
    },
    requestPermissions: () => notificationService.requestPermissions(),
  };
};
