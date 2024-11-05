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
  updateIsPending,
  setOpenMultiSigId,
  getOpenMultiSig,
  getScanGroupId,
  setScanGroupId,
} from "./identifiersCache";
import { RootState } from "../../index";
import { IdentifierShortDetails } from "../../../core/agent/services/identifier.types";
import { FavouriteIdentifier, MultiSigGroup } from "./identifiersCache.types";
import { ConnectionStatus } from "../../../core/agent/agent.types";
import { IdentifiersFilters } from "../../../ui/pages/Identifiers/Identifiers.types";

describe("identifiersCacheSlice", () => {
  const initialState = {
    identifiers: [],
    favourites: [],
    multiSigGroup: undefined,
    openMultiSigId: undefined,
    filters: IdentifiersFilters.All,
  };
  it("should return the initial state", () => {
    expect(
      identifiersCacheSlice.reducer(undefined, {} as PayloadAction)
    ).toEqual(initialState);
  });

  it("should handle setIdentifiersCache", () => {
    const identifiers: IdentifierShortDetails[] = [
      {
        id: "id-1",
        displayName: "example-name",
        createdAtUTC: "example-date",
        theme: 0,
        isPending: false,
      },
    ];
    const newState = identifiersCacheSlice.reducer(
      initialState,
      setIdentifiersCache(identifiers)
    );
    expect(newState.identifiers).toEqual(identifiers);
  });

  it("should handle setMultiSigGroupCache", () => {
    const multiSigGroup: MultiSigGroup = {
      groupId: "group-id",
      connections: [
        {
          id: "did:example:ebfeb1ebc6f1c276ef71212ec21",
          label: "Cambridge University",
          connectionDate: "2017-08-13T19:23:24Z",
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
  it("should handle setFavouritesIdentifiersCache", () => {
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
  it("should handle addFavouriteIdentifierCache", () => {
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
  it("should handle removeFavouriteIdentifierCache", () => {
    const initialState = {
      identifiers: [],
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

  it("should handle updateOrAddIdentifiersCache", () => {
    const identifiers: IdentifierShortDetails[] = [
      {
        id: "id-1",
        displayName: "example-name",
        createdAtUTC: "example-date",
        theme: 0,
        isPending: false,
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
      isPending: false,
    };
    const newState = identifiersCacheSlice.reducer(
      currentState,
      updateOrAddIdentifiersCache(identifier)
    );
    expect(newState.identifiers).toEqual([...identifiers, identifier]);
  });

  it("should handle updateIsPending", () => {
    const identifiers: IdentifierShortDetails[] = [
      {
        id: "id-1",
        displayName: "example-name",
        createdAtUTC: "example-date",
        theme: 0,
        isPending: true,
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
      isPending: false,
    };
    const newState = identifiersCacheSlice.reducer(
      currentState,
      updateIsPending({ id: identifier.id, isPending: identifier.isPending })
    );
    expect(newState.identifiers).toEqual([identifier]);
  });

  it("should handle setOpenMultiSigId", () => {
    const newState = identifiersCacheSlice.reducer(
      initialState,
      setOpenMultiSigId("id")
    );
    expect(newState.openMultiSigId).toEqual("id");
  });

  it("should handle setScanGroupId", () => {
    const newState = identifiersCacheSlice.reducer(
      initialState,
      setScanGroupId("id")
    );
    expect(newState.scanGroupId).toEqual("id");
  });
});

describe("get identifier Cache", () => {
  it("should return the identifiers cache from RootState", () => {
    const state = {
      identifiersCache: {
        identifiers: [
          {
            id: "id-1",
            displayName: "example-name-1",
            createdAtUTC: "example-date",
          },
          {
            id: "id-2",
            displayName: "example-name-2",
            createdAtUTC: "example-date",
          },
        ],
      },
    } as RootState;
    const identifiersCache = getIdentifiersCache(state);
    expect(identifiersCache).toEqual(state.identifiersCache.identifiers);
  });
  it("should return the favourites cache from RootState", () => {
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
  it("should return the multiSigGroupCache from RootState", () => {
    const state = {
      identifiersCache: {
        multiSigGroup: {
          groupId: "group-id",
          connections: [
            {
              id: "did:example:ebfeb1ebc6f1c276ef71212ec21",
              label: "Cambridge University",
              connectionDate: "2017-08-13T19:23:24Z",
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
  it("should return the openMultiSigId from RootState", () => {
    const state = {
      identifiersCache: {
        openMultiSigId: "groupId",
      },
    } as RootState;
    const openMultiSigId = getOpenMultiSig(state);
    expect(openMultiSigId).toEqual(state.identifiersCache.openMultiSigId);
  });
  it("should return the scanGroupId from RootState", () => {
    const state = {
      identifiersCache: {
        scanGroupId: "groupId",
      },
    } as RootState;
    const scanGroupId = getScanGroupId(state);
    expect(scanGroupId).toEqual(state.identifiersCache.scanGroupId);
  });
});
