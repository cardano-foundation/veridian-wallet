import { PayloadAction } from "@reduxjs/toolkit";
import { multisigMetadataRecord } from "../../../core/__fixtures__/agent/multiSigFixtures";
import {
  CredentialShortDetails,
  CredentialStatus,
} from "../../../core/agent/services/credentialService.types";
import { IdentifierType } from "../../../core/agent/services/identifier.types";
import { CredentialsFilters } from "../../../ui/pages/Credentials/Credentials.types";
import { RootState } from "../../index";
import { FavouriteCredential } from "./credCache.types";
import {
  addFavouritesCredsCache,
  clearCredCache,
  credsCacheSlice,
  getCredentialsFilters,
  getCredsCache,
  getFavouritesCredsCache,
  removeFavouritesCredsCache,
  setCredentialsFilters,
  setCredsCache,
  setFavouritesCredsCache,
  updateOrAddCredsCache,
} from "./credsCache";

describe("credsCacheSlice", () => {
  const initialState = {
    creds: [],
    favourites: [],
    filters: CredentialsFilters.All,
  };
  it("should return the initial state", () => {
    expect(credsCacheSlice.reducer(undefined, {} as PayloadAction)).toEqual(
      initialState
    );
  });

  it("should handle setCredsCache", () => {
    const creds: CredentialShortDetails[] = [
      {
        id: "did:example:ebfeb1f712ebc6f1c276e12ec21",
        issuanceDate: "2010-01-01T19:23:24Z",
        credentialType: "University Credential",
        status: CredentialStatus.CONFIRMED,
        schema: "EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao",
        identifierType: IdentifierType.Individual,
        identifierId: multisigMetadataRecord.id,
        connectionId: "ebfeb1ebc6f1c276ef71212ec20",
      },
    ];
    const newState = credsCacheSlice.reducer(
      initialState,
      setCredsCache(creds)
    );
    expect(newState.creds).toEqual(creds);
  });

  it("should handle clearCredCache", () => {
    const creds: CredentialShortDetails[] = [
      {
        id: "did:example:ebfeb1f712ebc6f1c276e12ec21",
        issuanceDate: "2010-01-01T19:23:24Z",
        credentialType: "University Credential",
        status: CredentialStatus.CONFIRMED,
        schema: "EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao",
        identifierType: IdentifierType.Individual,
        identifierId: multisigMetadataRecord.id,
        connectionId: "ebfeb1ebc6f1c276ef71212ec20",
      },
    ];
    const newState = credsCacheSlice.reducer(
      {
        ...initialState,
        creds,
      },
      clearCredCache()
    );
    expect(newState).toEqual(initialState);
  });

  it("should handle add cred when cred does not exist", () => {
    const cred: CredentialShortDetails = {
      id: "did:example:ebfeb1f712ebc6f1c276e12ec21",
      issuanceDate: "2010-01-01T19:23:24Z",
      credentialType: "University Credential",
      status: CredentialStatus.CONFIRMED,
      schema: "EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao",
      identifierType: IdentifierType.Individual,
      identifierId: multisigMetadataRecord.id,
      connectionId: "ebfeb1ebc6f1c276ef71212ec20",
    };
    const newState = credsCacheSlice.reducer(
      initialState,
      updateOrAddCredsCache(cred)
    );
    expect(newState.creds).toEqual([cred]);
  });

  it("should handle update cred when cred exist", () => {
    const credId1 = "did:example:ebfeb1f712ebc6f1c276e12ec21";
    const credId2 = "did:example:ebfeb1f712ebc6f1c276e12ec22";
    const cred1: CredentialShortDetails = {
      id: credId1,
      issuanceDate: "2010-01-01T19:23:24Z",
      credentialType: "University Credential",
      status: CredentialStatus.PENDING,
      schema: "EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao",
      identifierType: IdentifierType.Group,
      identifierId: multisigMetadataRecord.id,
      connectionId: "ebfeb1ebc6f1c276ef71212ec20",
    };
    const cred2: CredentialShortDetails = {
      id: credId2,
      issuanceDate: "2010-01-01T19:23:24Z",
      credentialType: "University Credential",
      status: CredentialStatus.PENDING,
      schema: "EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao",
      identifierType: IdentifierType.Group,
      identifierId: multisigMetadataRecord.id,
      connectionId: "ebfeb1ebc6f1c276ef71212ec20",
    };
    const updateCred: CredentialShortDetails = {
      ...cred1,
      status: CredentialStatus.CONFIRMED,
    };
    const newState = credsCacheSlice.reducer(
      {
        creds: [cred1, cred2],
        favourites: [],
        filters: CredentialsFilters.All,
      },
      updateOrAddCredsCache(updateCred)
    );
    expect(newState.creds).toEqual([cred2, updateCred]);
  });

  it("should handle setFavouritesCredsCache", () => {
    const favs: FavouriteCredential[] = [
      {
        id: "did:example:ebfeb1f712ebc6f1c276e12ec21",
        time: 1,
      },
    ];
    const newState = credsCacheSlice.reducer(
      initialState,
      setFavouritesCredsCache(favs)
    );
    expect(newState.favourites).toEqual(favs);
  });

  it("should handle addFavouritesCredsCache", () => {
    const fav: FavouriteCredential = {
      id: "abcd",
      time: 1,
    };
    const newState = credsCacheSlice.reducer(
      initialState,
      addFavouritesCredsCache(fav)
    );
    expect(newState.favourites).toEqual([fav]);
  });

  it("should handle removeFavouritesCredsCache", () => {
    const state = {
      creds: [],
      favourites: [
        {
          id: "abcd",
          time: 1,
        },
      ],
      filters: CredentialsFilters.All,
    };
    const newState = credsCacheSlice.reducer(
      state,
      removeFavouritesCredsCache("abcd")
    );
    expect(newState.favourites).toEqual([]);
  });
});

it("should handle setCredentialsFilters", () => {
  const initialState = {
    creds: [],
    favourites: [],
    filters: CredentialsFilters.All,
  };
  const filter: CredentialsFilters = CredentialsFilters.Individual;
  const newState = credsCacheSlice.reducer(
    initialState,
    setCredentialsFilters(filter)
  );
  expect(newState.filters).toEqual(filter);
});

describe("get methods for CredsCache", () => {
  it("should return the creds cache from RootState", () => {
    const state = {
      credsCache: {
        creds: [
          {
            id: "did:example:ebfeb1f712ebc6f1c276e12ec21",
            issuanceDate: "2010-01-01T19:23:24Z",
            credentialType: "University Credential",
            nameOnCredential: "Thomas A. Mayfield",
            status: "confirmed",
          },
          {
            id: "did:example:ebfeb1f712ebc6f1c276e12ec22",
            issuanceDate: "2010-01-01T19:23:24Z",
            credentialType: "University Credential",
            status: "confirmed",
          },
        ],
      },
    } as RootState;
    const credsCache = getCredsCache(state);
    expect(credsCache).toEqual(state.credsCache.creds);
  });
  it("should return the favourites creds cache from RootState", () => {
    const state = {
      credsCache: {
        favourites: [
          {
            id: "abcd",
            time: 1,
          },
          {
            id: "efgh",
            time: 2,
          },
        ],
      },
    } as RootState;
    const favouritesCredsCache = getFavouritesCredsCache(state);
    expect(favouritesCredsCache).toEqual(state.credsCache.favourites);
  });
  it("should return the Credentials Filters from RootState", () => {
    const state = {
      credsCache: {
        filters: CredentialsFilters.Individual,
      },
    } as RootState;
    const filtersCache = getCredentialsFilters(state);
    expect(filtersCache).toEqual(state.credsCache.filters);
  });
});
