import { PayloadAction } from "@reduxjs/toolkit";
import {
  identifiersCacheSlice,
  getIdentifiersCache,
  setIdentifiersCache,
  setFavouritesIdentifiersCache,
  addFavouriteIdentifierCache,
  removeFavouriteIdentifierCache,
  getFavouritesIdentifiersCache,
  setMultiSigGroupCache,
  getMultiSigGroupCache,
  updateOrAddIdentifiersCache,
  updateCreationStatus,
  setOpenMultiSigId,
  getOpenMultiSig,
  getScanGroupId,
  setScanGroupId,
  getIdentifiersFilters,
  setIdentifiersFilters,
  addGroupIdentifierCache,
  clearIdentifierCache,
} from "./identifiersCache";
import { RootState } from "../../index";
import { IdentifierShortDetails } from "../../../core/agent/services/identifier.types";
import {
  CreationStatus,
  ConnectionStatus,
} from "../../../core/agent/agent.types";
import { FavouriteIdentifier, MultiSigGroup } from "./identifiersCache.types";
import { IdentifiersFilters } from "../../../ui/pages/Identifiers/Identifiers.types";
import {
  multisignIdentifierFix,
  pendingGroupIdentifierFix,
  pendingIdentifierFix,
  pendingMemberIdentifierFix,
} from "../../../ui/__fixtures__/filteredIdentifierFix";

describe("identifiersCacheSlice", () => {
  const initialState = {
    identifiers: {},
    favourites: [],
    multiSigGroup: undefined,
    openMultiSigId: undefined,
    filters: IdentifiersFilters.All,
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
          contactId: "did:example:ebfeb1ebc6f1c276ef71212ec21",
          groupId: "group-id",
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

  test("should handle setFavouritesIdentifiersCache", () => {
    const favourites: FavouriteIdentifier[] = [
      {
        id: "abcd",
        time: 1,
      },
    ];
    const newState = identifiersCacheSlice.reducer(
      initialState,
      setFavouritesIdentifiersCache(favourites)
    );
    expect(newState.favourites).toEqual(favourites);
  });

  test("should handle addFavouriteIdentifierCache", () => {
    const favourite: FavouriteIdentifier = {
      id: "abcd",
      time: 1,
    };
    const newState = identifiersCacheSlice.reducer(
      initialState,
      addFavouriteIdentifierCache(favourite)
    );
    expect(newState.favourites).toEqual([favourite]);
  });

  test("should handle removeFavouriteIdentifierCache", () => {
    const initialState = {
      identifiers: {},
      favourites: [
        {
          id: "abcd",
          time: 1,
        },
      ],
      multiSigGroup: undefined,
      filters: IdentifiersFilters.All,
    };
    const newState = identifiersCacheSlice.reducer(
      initialState,
      removeFavouriteIdentifierCache("abcd")
    );
    expect(newState.favourites).toEqual([]);
  });

  test("should handle setIdentifiersFilters", () => {
    const filter: IdentifiersFilters = IdentifiersFilters.Individual;
    const newState = identifiersCacheSlice.reducer(
      initialState,
      setIdentifiersFilters(filter)
    );
    expect(newState.filters).toEqual(filter);
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

  test("should return the favourites cache from RootState", () => {
    const state = {
      identifiersCache: {
        favourites: [
          {
            id: "id-1",
            time: 1,
          },
          {
            id: "id-2",
            time: 2,
          },
        ],
      },
    } as RootState;
    const favouriteCache = getFavouritesIdentifiersCache(state);
    expect(favouriteCache).toEqual(state.identifiersCache.favourites);
  });

  test("should return the Identifiers Filters from RootState", () => {
    const state = {
      identifiersCache: {
        filters: IdentifiersFilters.All,
      },
    } as RootState;
    const filtersCache = getIdentifiersFilters(state);
    expect(filtersCache).toEqual(state.identifiersCache.filters);
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
