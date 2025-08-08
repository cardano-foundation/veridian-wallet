import { PayloadAction } from "@reduxjs/toolkit";
import { storeStateFixData } from "../../../ui/__fixtures__/storeDataFix";
import { CardListViewType } from "../../../ui/components/SwitchCardView";
import {
  getCredentialsFilters,
  getFavouritesCredsCache,
  setCredentialFavouriteIndex,
  setCredentialsFilters,
  setCredentialViewTypeCache,
  setFavouritesCredsCache,
  viewTypeCacheSlice,
} from "./viewTypeCache";
import { CredentialsFilters } from "./viewTypeCache.types";

describe("identifierViewTypeCache", () => {
  const initialState = {
    credential: {
      viewType: null,
      favouriteIndex: 0,
      favourites: [],
      filters: CredentialsFilters.All,
    },
  };
  it("should return the initial state", () => {
    expect(viewTypeCacheSlice.reducer(undefined, {} as PayloadAction)).toEqual(
      initialState
    );
  });

  it("should handle setCreVidewTypeCache", () => {
    const newState = viewTypeCacheSlice.reducer(
      initialState,
      setCredentialViewTypeCache(CardListViewType.List)
    );
    expect(newState.credential.viewType).toEqual(CardListViewType.List);
  });

  it("should handle setCredFavouriteIndex", () => {
    const newState = viewTypeCacheSlice.reducer(
      initialState,
      setCredentialFavouriteIndex(1)
    );
    expect(newState.credential.favouriteIndex).toEqual(1);
  });

  it("should return favourites creds", () => {
    const data = getFavouritesCredsCache({
      ...storeStateFixData,
      viewTypeCache: {
        credential: {
          viewType: CardListViewType.List,
          favouriteIndex: 0,
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
          filters: CredentialsFilters.All,
        },
      },
    });
    expect(data).toEqual([
      {
        id: "abcd",
        time: 1,
      },
      {
        id: "efgh",
        time: 2,
      },
    ]);
  });

  it("should return cred filter", () => {
    const data = getCredentialsFilters({
      ...storeStateFixData,
      viewTypeCache: {
        credential: {
          viewType: CardListViewType.List,
          favouriteIndex: 0,
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
          filters: CredentialsFilters.All,
        },
      },
    });
    expect(data).toEqual(CredentialsFilters.All);
  });

  it("should handle set favourites", () => {
    const newState = viewTypeCacheSlice.reducer(
      initialState,
      setFavouritesCredsCache([
        {
          id: "abcd",
          time: 1,
        },
        {
          id: "efgh",
          time: 2,
        },
      ])
    );
    expect(newState.credential.favourites).toEqual([
      {
        id: "abcd",
        time: 1,
      },
      {
        id: "efgh",
        time: 2,
      },
    ]);
  });

  it("should handle set filters", () => {
    const newState = viewTypeCacheSlice.reducer(
      initialState,
      setCredentialsFilters(CredentialsFilters.Group)
    );
    expect(newState.credential.filters).toEqual(CredentialsFilters.Group);
  });
});
