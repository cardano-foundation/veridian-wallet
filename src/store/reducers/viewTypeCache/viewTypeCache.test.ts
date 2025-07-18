import { PayloadAction } from "@reduxjs/toolkit";
import { CardListViewType } from "../../../ui/components/SwitchCardView";
import {
  setCredentialFavouriteIndex,
  setCredentialViewTypeCache,
  viewTypeCacheSlice,
} from "./viewTypeCache";

describe("identifierViewTypeCache", () => {
  const initialState = {
    credential: {
      viewType: null,
      favouriteIndex: 0,
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
});
