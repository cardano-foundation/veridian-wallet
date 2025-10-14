import { PayloadAction } from "@reduxjs/toolkit";
import {
  ConnectionStatus,
  CreationStatus,
} from "../../../core/agent/agent.types";
import {
  CredentialShortDetails,
  CredentialStatus,
} from "../../../core/agent/services/credentialService.types";
import {
  IdentifierShortDetails,
  IdentifierType,
} from "../../../core/agent/services/identifier.types";
import { filteredCredsFix } from "../../../ui/__fixtures__/filteredCredsFix";
import {
  pendingGroupIdentifierFix,
  pendingIdentifierFix,
  pendingMemberIdentifierFix,
} from "../../../ui/__fixtures__/filteredIdentifierFix";
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
  addGroupProfile,
  addNotification,
  addOrUpdateProfileIdentity,
  deleteNotificationById,
  getCredsArchivedCache,
  getCredsCache,
  getCurrentProfile,
  getNotificationsCache,
  getPeerConnections,
  getProfileGroupCache,
  getRecentProfiles,
  getScanGroupId,
  markNotificationAsRead,
  profilesCacheSlice,
  setCredsArchivedCache,
  setCredsCache,
  setGroupProfileCache,
  setNotificationsCache,
  setPeerConnections,
  setProfiles,
  setScanGroupId,
  updateCurrentProfile,
  updateOrAddCredsCache,
  updateProfileCreationStatus,
  updateRecentProfiles,
} from "./profilesCache";
import {
  DAppConnection,
  MultiSigGroup,
  ProfileCache,
} from "./profilesCache.types";

describe("Profile cache", () => {
  const initialState: ProfileCache = {
    profiles: {},
    recentProfiles: [],
    multiSigGroup: undefined,
    showProfileState: false,
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

  it("should return the wallet connetions cache from RootState", () => {
    const connectionCache = getPeerConnections(storeStateFixData);

    const defaultProfile =
      storeStateFixData.profilesCache.profiles[defaultProfileIdentifierFix.id];
    expect(connectionCache).toEqual(defaultProfile.peerConnections);
  });

  it("should handle setPeerConnections", () => {
    const connections: DAppConnection[] = [
      {
        meerkatId: "6",
        name: "Wallet name #2",
        selectedAid: defaultProfileIdentifierFix.id,
        url: "http://localhost:3001/",
      },
    ];
    const newState = profilesCacheSlice.reducer(
      profileCacheFixData,
      setPeerConnections(connections)
    );
    expect(
      newState.profiles[defaultProfileIdentifierFix.id].peerConnections
    ).toEqual(connections);
  });

  it("should return the archived state", () => {
    const data = getCredsArchivedCache(storeStateFixData);

    const defaultProfile =
      storeStateFixData.profilesCache.profiles[defaultProfileIdentifierFix.id];
    expect(data).toEqual(defaultProfile.archivedCredentials);
  });

  it("should handle setCredsArchivedCache", () => {
    const creds: CredentialShortDetails[] = [
      {
        id: "did:example:ebfeb1f712ebc6f1c276e12ec21",
        issuanceDate: "2010-01-01T19:23:24Z",
        credentialType: "University Credential",
        status: CredentialStatus.CONFIRMED,
        schema: "EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao",
        identifierType: IdentifierType.Individual,
        identifierId: defaultProfileIdentifierFix.id,
        connectionId: "ebfeb1ebc6f1c276ef71212ec20",
      },
    ];
    const newState = profilesCacheSlice.reducer(
      profileCacheFixData,
      setCredsArchivedCache(creds)
    );

    const defaultProfile = newState.profiles[defaultProfileIdentifierFix.id];
    expect(defaultProfile.archivedCredentials).toEqual(creds);
  });

  test("should handle setGroupProfileCache", () => {
    const multiSigGroup: MultiSigGroup = {
      groupId: "group-id",
      connections: [
        {
          id: "did:example:ebfeb1ebc6f1c276ef71212ec21",
          label: "Cambridge University",
          createdAtUTC: "2017-08-13T19:23:24Z",
          logo: "logo.png",
          status: ConnectionStatus.CONFIRMED,
          contactId: "conn-id-1",
          groupId: "group-id",
        },
      ],
    };
    const newState = profilesCacheSlice.reducer(
      initialState,
      setGroupProfileCache(multiSigGroup)
    );
    expect(newState.multiSigGroup).toEqual(multiSigGroup);
  });

  test("should handle addOrUpdateProfileIdentity", () => {
    const profile = {
      id: "id-1",
      displayName: "example-name",
      createdAtUTC: "example-date",
      theme: 0,
      creationStatus: CreationStatus.COMPLETE,
    };

    const newState = profilesCacheSlice.reducer(
      initialState,
      addOrUpdateProfileIdentity(profile)
    );

    expect(newState.profiles[profile.id].identity).toEqual(profile);
  });

  test("should handle updateCreationStatus", () => {
    const identifier: IdentifierShortDetails = {
      id: "id-1",
      displayName: "example-name",
      createdAtUTC: "example-date",
      theme: 0,
      creationStatus: CreationStatus.PENDING,
    };

    const currentState = profilesCacheSlice.reducer(
      initialState,
      addOrUpdateProfileIdentity(identifier)
    );

    const identifierNew: IdentifierShortDetails = {
      id: "id-1",
      displayName: "example-name",
      createdAtUTC: "example-date",
      theme: 0,
      creationStatus: CreationStatus.COMPLETE,
    };

    const newState = profilesCacheSlice.reducer(
      currentState,
      updateProfileCreationStatus({
        id: identifierNew.id,
        creationStatus: identifierNew.creationStatus,
      })
    );

    expect(newState.profiles[identifierNew.id].identity).toEqual(identifierNew);
  });

  test("should handle setScanGroupId", () => {
    const newState = profilesCacheSlice.reducer(
      initialState,
      setScanGroupId("id")
    );
    expect(newState.scanGroupId).toEqual("id");
  });

  test("should handle addGroupIdentifierCache", () => {
    const state = {
      ...initialState,
      profiles: {
        [pendingMemberIdentifierFix[0].id]: {
          identity: pendingMemberIdentifierFix[0],
          connections: [],
          multisigConnections: [],
          peerConnections: [],
          credentials: [],
          archivedCredentials: [],
          notifications: [],
        },
        [pendingIdentifierFix.id]: {
          identity: pendingIdentifierFix,
          connections: [],
          multisigConnections: [],
          peerConnections: [],
          credentials: [],
          archivedCredentials: [],
          notifications: [],
        },
      },
    };
    const newState = profilesCacheSlice.reducer(
      state,
      addGroupProfile(pendingGroupIdentifierFix)
    );
    expect(newState.profiles).toEqual({
      [pendingIdentifierFix.id]: {
        identity: pendingIdentifierFix,
        connections: [],
        multisigConnections: [],
        peerConnections: [],
        credentials: [],
        archivedCredentials: [],
        notifications: [],
      },
      [pendingGroupIdentifierFix.id]: {
        identity: pendingGroupIdentifierFix,
        connections: [],
        multisigConnections: [],
        peerConnections: [],
        credentials: [],
        archivedCredentials: [],
        notifications: [],
      },
    });
  });

  test("should return the multiSigGroupCache from RootState", () => {
    const state = {
      profilesCache: {
        multiSigGroup: {
          groupId: "group-id",
          connections: [
            {
              id: "did:example:ebfeb1ebc6f1c276ef71212ec21",
              label: "Cambridge University",
              createdAtUTC: "2017-08-13T19:23:24Z",
              logo: "logo.png",
              status: ConnectionStatus.CONFIRMED,
            },
          ],
        },
      },
    } as any;
    const profiles = getProfileGroupCache(state);
    expect(profiles).toEqual(state.profilesCache.multiSigGroup);
  });

  test("should return the scanGroupId from RootState", () => {
    const state = {
      profilesCache: {
        scanGroupId: "groupId",
      },
    } as any;
    const scanGroupId = getScanGroupId(state);
    expect(scanGroupId).toEqual(state.profilesCache.scanGroupId);
  });
});
