import { PayloadAction } from "@reduxjs/toolkit";
import {
  ConnectionStatus,
  CreationStatus,
} from "../../../core/agent/agent.types";
import { IdentifierShortDetails } from "../../../core/agent/services/identifier.types";
import {
  multisignIdentifierFix,
  pendingGroupIdentifierFix,
  pendingIdentifierFix,
  pendingMemberIdentifierFix,
} from "../../../ui/__fixtures__/filteredIdentifierFix";
import { RootState } from "../../index";
import {
  addGroupIdentifierCache,
  clearIdentifierCache,
  getIdentifiersCache,
  getMultiSigGroupCache,
  getOpenMultiSig,
  getScanGroupId,
  identifiersCacheSlice,
  setIdentifiersCache,
  setMultiSigGroupCache,
  setOpenMultiSigId,
  setScanGroupId,
  updateCreationStatus,
  updateOrAddIdentifiersCache,
} from "./identifiersCache";
import { MultiSigGroup } from "./identifiersCache.types";

describe("identifiersCacheSlice", () => {
  const initialState = {
    identifiers: {},
    multiSigGroup: undefined,
    openMultiSigId: undefined,
  };

  test("should return the initial state", () => {
    expect(
      identifiersCacheSlice.reducer(undefined, {} as PayloadAction)
    ).toEqual(initialState);
  });

  test("should handle setIdentifiersCache", () => {
    const identifiers: IdentifierShortDetails[] = [
      {
        id: "id-1",
        displayName: "example-name",
        createdAtUTC: "example-date",
        theme: 0,
        creationStatus: CreationStatus.COMPLETE,
      },
    ];
    const newState = identifiersCacheSlice.reducer(
      initialState,
      setIdentifiersCache(identifiers)
    );
    expect(newState.identifiers).toEqual({
      "id-1": {
        id: "id-1",
        displayName: "example-name",
        createdAtUTC: "example-date",
        theme: 0,
        creationStatus: CreationStatus.COMPLETE,
      },
    });
  });

  test("should handle clearIdentifierCache", () => {
    const identifiers: IdentifierShortDetails[] = [
      {
        id: "id-1",
        displayName: "example-name",
        createdAtUTC: "example-date",
        theme: 0,
        creationStatus: CreationStatus.COMPLETE,
      },
    ];
    const newState = identifiersCacheSlice.reducer(
      { ...initialState, identifiers: { "id-1": identifiers[0] } },
      clearIdentifierCache()
    );
    expect(newState).toEqual(initialState);
  });

  test("should handle setMultiSigGroupCache", () => {
    const multiSigGroup: MultiSigGroup = {
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
    };
    const newState = identifiersCacheSlice.reducer(
      initialState,
      setMultiSigGroupCache(multiSigGroup)
    );
    expect(newState.multiSigGroup).toEqual(multiSigGroup);
  });

  test("should handle updateOrAddIdentifiersCache", () => {
    const identifiers: IdentifierShortDetails[] = [
      {
        id: "id-1",
        displayName: "example-name",
        createdAtUTC: "example-date",
        theme: 0,
        creationStatus: CreationStatus.COMPLETE,
      },
    ];
    const currentState = identifiersCacheSlice.reducer(
      initialState,
      setIdentifiersCache(identifiers)
    );
    const identifier: IdentifierShortDetails = {
      id: "id-2",
      displayName: "example-name",
      createdAtUTC: "example-date",
      theme: 0,
      creationStatus: CreationStatus.COMPLETE,
    };
    const newState = identifiersCacheSlice.reducer(
      currentState,
      updateOrAddIdentifiersCache(identifier)
    );
    expect(newState.identifiers).toEqual({
      "id-1": {
        id: "id-1",
        displayName: "example-name",
        createdAtUTC: "example-date",
        theme: 0,
        creationStatus: CreationStatus.COMPLETE,
      },
      "id-2": {
        id: "id-2",
        displayName: "example-name",
        createdAtUTC: "example-date",
        theme: 0,
        creationStatus: CreationStatus.COMPLETE,
      },
    });
  });

  test("should handle updateCreationStatus", () => {
    const identifiers: IdentifierShortDetails[] = [
      {
        id: "id-1",
        displayName: "example-name",
        createdAtUTC: "example-date",
        theme: 0,
        creationStatus: CreationStatus.PENDING,
      },
    ];

    const currentState = identifiersCacheSlice.reducer(
      initialState,
      setIdentifiersCache(identifiers)
    );

    const identifier: IdentifierShortDetails = {
      id: "id-1",
      displayName: "example-name",
      createdAtUTC: "example-date",
      theme: 0,
      creationStatus: CreationStatus.COMPLETE,
    };

    const newState = identifiersCacheSlice.reducer(
      currentState,
      updateCreationStatus({
        id: identifier.id,
        creationStatus: identifier.creationStatus,
      })
    );

    expect(newState.identifiers).toEqual({
      "id-1": {
        id: "id-1",
        displayName: "example-name",
        createdAtUTC: "example-date",
        theme: 0,
        creationStatus: CreationStatus.COMPLETE,
      },
    });
  });

  test("should handle setOpenMultiSigId", () => {
    const newState = identifiersCacheSlice.reducer(
      initialState,
      setOpenMultiSigId("id")
    );
    expect(newState.openMultiSigId).toEqual("id");
  });

  test("should handle setScanGroupId", () => {
    const newState = identifiersCacheSlice.reducer(
      initialState,
      setScanGroupId("id")
    );
    expect(newState.scanGroupId).toEqual("id");
  });

  test("should handle addGroupIdentifierCache", () => {
    const state = {
      ...initialState,
      identifiers: {
        [pendingMemberIdentifierFix[0].id]: pendingMemberIdentifierFix[0],
        [pendingIdentifierFix.id]: pendingIdentifierFix,
      },
    };
    const newState = identifiersCacheSlice.reducer(
      state,
      addGroupIdentifierCache(pendingGroupIdentifierFix)
    );
    expect(newState.identifiers).toEqual({
      [pendingIdentifierFix.id]: pendingIdentifierFix,
      [pendingGroupIdentifierFix.id]: pendingGroupIdentifierFix,
    });
  });

  test("addGroupIdentifierCache should not error if applied twice (idempotent)", () => {
    const state = {
      ...initialState,
      identifiers: {
        [pendingIdentifierFix.id]: pendingIdentifierFix,
        [multisignIdentifierFix[0].id]: multisignIdentifierFix[0],
      },
    };
    const newState = identifiersCacheSlice.reducer(
      state,
      addGroupIdentifierCache(multisignIdentifierFix[0])
    );
    expect(newState.identifiers).toEqual({
      [pendingIdentifierFix.id]: pendingIdentifierFix,
      [multisignIdentifierFix[0].id]: multisignIdentifierFix[0],
    });
  });
});

describe("get identifier Cache", () => {
  test("should return the identifiers cache from RootState", () => {
    const state = {
      identifiersCache: {
        identifiers: {},
      },
    } as RootState;
    state.identifiersCache.identifiers["id-1"] = {
      id: "id-1",
      displayName: "example-name-1",
      createdAtUTC: "example-date",
      theme: 0,
      creationStatus: CreationStatus.PENDING,
    };

    const identifiersCache = getIdentifiersCache(state);
    expect(identifiersCache).toEqual(state.identifiersCache.identifiers);
  });

  test("should return the multiSigGroupCache from RootState", () => {
    const state = {
      identifiersCache: {
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
    } as RootState;
    const identifiersCache = getMultiSigGroupCache(state);
    expect(identifiersCache).toEqual(state.identifiersCache.multiSigGroup);
  });

  test("should return the openMultiSigId from RootState", () => {
    const state = {
      identifiersCache: {
        openMultiSigId: "groupId",
      },
    } as RootState;
    const openMultiSigId = getOpenMultiSig(state);
    expect(openMultiSigId).toEqual(state.identifiersCache.openMultiSigId);
  });

  test("should return the scanGroupId from RootState", () => {
    const state = {
      identifiersCache: {
        scanGroupId: "groupId",
      },
    } as RootState;
    const scanGroupId = getScanGroupId(state);
    expect(scanGroupId).toEqual(state.identifiersCache.scanGroupId);
  });
});
