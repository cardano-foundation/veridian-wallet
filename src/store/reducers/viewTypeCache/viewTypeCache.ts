import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { CardListViewType } from "../../../ui/components/SwitchCardView";
import { RootState } from "../../index";
import { ViewTypeCacheProps } from "./viewTypeCache.types";

const initialState: ViewTypeCacheProps = {
  credential: {
    viewType: null,
    favouriteIndex: 0,
  },
};

const viewTypeCacheSlice = createSlice({
  name: "viewTypeCacheSlice",
  initialState,
  reducers: {
    setCredentialViewTypeCache: (
      state,
      action: PayloadAction<CardListViewType>
    ) => {
      state.credential.viewType = action.payload;
    },
    setCredentialFavouriteIndex: (state, action: PayloadAction<number>) => {
      state.credential.favouriteIndex = action.payload;
    },
    clearViewTypeCache: () => initialState,
  },
});

export const {
  setCredentialFavouriteIndex,
  setCredentialViewTypeCache,
  clearViewTypeCache,
} = viewTypeCacheSlice.actions;

const getCredentialViewTypeCache = (state: RootState) =>
  state.viewTypeCache.credential;

const getCredentialFavouriteIndex = (state: RootState) =>
  state.viewTypeCache.credential.favouriteIndex;

export {
  getCredentialFavouriteIndex,
  getCredentialViewTypeCache,
  initialState,
  viewTypeCacheSlice,
};
