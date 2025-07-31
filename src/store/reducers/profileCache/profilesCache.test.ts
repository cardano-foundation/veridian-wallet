import { PayloadAction } from "@reduxjs/toolkit";
import { filteredCredsFix } from "../../../ui/__fixtures__/filteredCredsFix";
import { notificationsFix } from "../../../ui/__fixtures__/notificationsFix";
import {
  defaultProfileDataFix,
  defaultProfileIdentifierFix,
  profileCacheFixData,
  profilesCachesFix,
  recentProfilesDataFix,
  storeStateFixData,
} from "../../../ui/__fixtures__/storeDataFix";
import {
  addNotification,
  deleteNotificationById,
  getCredsCache,
  getCurrentProfile,
  getNotificationsCache,
  getRecentProfiles,
  markNotificationAsRead,
  profilesCacheSlice,
  setCredsCache,
  setNotificationsCache,
  setProfiles,
  updateCurrentProfile,
  updateOrAddCredsCache,
  updateRecentProfiles,
} from "./profilesCache";
import { ProfileCache } from "./profilesCache.types";

describe("Profile cache", () => {
  const initialState: ProfileCache = {
    profiles: {},
    recentProfiles: [],
  };

  it("should return the initial state", () => {
    expect(profilesCacheSlice.reducer(undefined, {} as PayloadAction)).toEqual(
      initialState
    );
  });

  it("should return default profile", () => {
    const data = getCurrentProfile(storeStateFixData);
    expect(data).toEqual(defaultProfileDataFix);
  });

  it("should return recents profile", () => {
    const data = getRecentProfiles(storeStateFixData);
    expect(data).toEqual(recentProfilesDataFix);
  });

  it("should set profiles", () => {
    const action = setProfiles(profilesCachesFix);
    const nextState = profilesCacheSlice.reducer(initialState, action);

    expect(nextState.profiles).toEqual(profilesCachesFix);
  });

  it("should set current profile", () => {
    const action = updateCurrentProfile(defaultProfileIdentifierFix.id);
    const nextState = profilesCacheSlice.reducer(initialState, action);

    expect(nextState.defaultProfile).toEqual(defaultProfileIdentifierFix.id);
  });

  it("should update recent profile", () => {
    const action = updateRecentProfiles(recentProfilesDataFix);
    const nextState = profilesCacheSlice.reducer(initialState, action);

    expect(nextState.recentProfiles).toEqual(recentProfilesDataFix);
  });

  it("should return notifications", () => {
    const data = getNotificationsCache(storeStateFixData);
    expect(data).toEqual(defaultProfileDataFix.notifications);
  });

  it("should set notification cache", () => {
    const action = setNotificationsCache(notificationsFix);
    const nextState = profilesCacheSlice.reducer(profileCacheFixData, action);

    const defaultProfile = nextState.profiles[defaultProfileIdentifierFix.id];

    expect(defaultProfile.notifications).toEqual(notificationsFix);
  });

  it("should set mark notification read", () => {
    const notification =
      profileCacheFixData.profiles[defaultProfileIdentifierFix.id]
        .notifications[0].id;

    const action = markNotificationAsRead({
      id: notification,
      read: true,
    });

    const nextState = profilesCacheSlice.reducer(profileCacheFixData, action);

    const defaultProfile = nextState.profiles[defaultProfileIdentifierFix.id];

    expect(defaultProfile.notifications[0].read).toEqual(true);
  });

  it("should delete notification", () => {
    const notification =
      profileCacheFixData.profiles[defaultProfileIdentifierFix.id]
        .notifications[0].id;

    const action = deleteNotificationById(notification);

    const nextState = profilesCacheSlice.reducer(profileCacheFixData, action);

    const defaultProfile = nextState.profiles[defaultProfileIdentifierFix.id];

    expect(
      defaultProfile.notifications.find((item) => item.id === notification)
    ).toEqual(undefined);
  });

  it("should add notification", () => {
    const newNoti = {
      ...notificationsFix[2],
      receivingPre: defaultProfileIdentifierFix.id,
    };
    const action = addNotification(newNoti);

    const nextState = profilesCacheSlice.reducer(profileCacheFixData, action);

    const defaultProfile = nextState.profiles[defaultProfileIdentifierFix.id];

    expect(
      defaultProfile.notifications.some((item) => item.id === newNoti.id)
    ).toEqual(true);
  });

  it("should get cred cache", () => {
    const data = getCredsCache(storeStateFixData);
    expect(data).toEqual(defaultProfileDataFix.credentials);
  });

  it("should set cred cache", () => {
    const action = setCredsCache(filteredCredsFix);

    const nextState = profilesCacheSlice.reducer(profileCacheFixData, action);

    const defaultProfile = nextState.profiles[defaultProfileIdentifierFix.id];

    expect(defaultProfile.credentials).toEqual(filteredCredsFix);
  });

  it("should add or update cred cache", () => {
    const newCred = {
      ...filteredCredsFix[1],
      identifierId: defaultProfileIdentifierFix.id,
    };
    const action = updateOrAddCredsCache(newCred);
    const nextState = profilesCacheSlice.reducer(profileCacheFixData, action);
    const defaultProfile = nextState.profiles[defaultProfileIdentifierFix.id];
    expect(
      defaultProfile.credentials.some((item) => item.id === newCred.id)
    ).toEqual(true);
  });
});
