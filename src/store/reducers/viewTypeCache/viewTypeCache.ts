import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { CardListViewType } from "../../../ui/components/SwitchCardView";
import { RootState } from "../../index";
import {
  CredentialsFilters,
  FavouriteCredential,
  ViewTypeCacheProps,
} from "./viewTypeCache.types";

const initialState: ViewTypeCacheProps = {
  credential: {
    viewType: null,
    favouriteIndex: 0,
    favourites: [],
    filters: CredentialsFilters.All,
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
    setFavouritesCredsCache: (
      state,
      action: PayloadAction<FavouriteCredential[]>
    ) => {
      state.credential.favourites = action.payload;
    },
    addFavouritesCredsCache: (
      state,
      action: PayloadAction<FavouriteCredential>
    ) => {
      if (
        state.credential.favourites.some((fav) => fav.id === action.payload.id)
      )
        return;
      state.credential.favourites = [
        action.payload,
        ...state.credential.favourites,
      ];
    },
    removeFavouritesCredsCache: (state, action: PayloadAction<string>) => {
      state.credential.favourites = state.credential.favourites.filter(
        (fav) => fav.id !== action.payload
      );
    },
    setCredentialsFilters: (
      state,
      action: PayloadAction<CredentialsFilters>
    ) => {
      state.credential.filters = action.payload;
    },
    clearViewTypeCache: () => initialState,
  },
});

export const {
  setCredentialFavouriteIndex,
  setCredentialViewTypeCache,
  clearViewTypeCache,
  setCredentialsFilters,
  setFavouritesCredsCache,
  addFavouritesCredsCache,
  removeFavouritesCredsCache,
} = viewTypeCacheSlice.actions;

const getCredentialViewTypeCache = (state: RootState) =>
  state.viewTypeCache.credential;
const getCredentialFavouriteIndex = (state: RootState) =>
  state.viewTypeCache.credential.favouriteIndex;
const getFavouritesCredsCache = (state: RootState) =>
  state.viewTypeCache.credential.favourites;
const getCredentialsFilters = (state: RootState) =>
  state.viewTypeCache.credential.filters;

export {
  getCredentialFavouriteIndex,
  getCredentialsFilters,
  getCredentialViewTypeCache,
  getFavouritesCredsCache,
  initialState,
  viewTypeCacheSlice,
};
