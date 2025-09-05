import { useEffect, useRef } from "react";
import { useAppSelector, useAppDispatch } from "../../store/hooks";
import {
  getCurrentProfile,
  setCurrentProfile,
  getProfiles,
} from "../../store/reducers/profileCache";
import { setCurrentRoute, setToastMsg } from "../../store/reducers/stateCache";
import { notificationService } from "../../core/services/notificationService";
import { KeriaNotification } from "../../core/agent/services/keriaNotificationService.types";
import { ToastMsgType } from "../globals/types";

export const useLocalNotifications = () => {
  const allProfiles = useAppSelector(getProfiles);
  const currentProfile = useAppSelector(getCurrentProfile);
  const dispatch = useAppDispatch();
  const shownNotificationsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Set up profile switcher for notification taps
    notificationService.setProfileSwitcher((profileId: string) => {
      dispatch(setCurrentProfile(profileId));
      dispatch(setToastMsg(ToastMsgType.PROFILE_SWITCHED));
    });

    // Set up navigator for notification navigation
    notificationService.setNavigator((path: string) => {
      dispatch(setCurrentRoute({ path }));
    });
  }, [dispatch]);

  useEffect(() => {
    // Get all unread notifications from OTHER profiles (not current profile)
    const allUnreadNotifications: KeriaNotification[] = [];

    if (allProfiles && currentProfile) {
      Object.values(allProfiles).forEach((profile) => {
        // Only show notifications from profiles OTHER than the current one
        if (
          profile.identity?.id !== currentProfile.identity?.id &&
          profile.notifications
        ) {
          const unreadFromProfile = profile.notifications.filter(
            (notification) =>
              !notification.read &&
              !shownNotificationsRef.current.has(notification.id)
          );
          allUnreadNotifications.push(...unreadFromProfile);
        }
      });
    }

    allUnreadNotifications.forEach((notification) => {
      notificationService.showLocalNotification(
        notification,
        currentProfile?.identity.id
      );
      shownNotificationsRef.current.add(notification.id);
    });

    // Clean up shown notifications that are no longer in any profile's cache
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
  }, [allProfiles, currentProfile]);

  return {
    showNotification: (notification: KeriaNotification) => {
      if (!shownNotificationsRef.current.has(notification.id)) {
        notificationService.showLocalNotification(
          notification,
          currentProfile?.identity.id
        );
        shownNotificationsRef.current.add(notification.id);
      }
    },
    requestPermissions: () => notificationService.requestPermissions(),
  };
};
