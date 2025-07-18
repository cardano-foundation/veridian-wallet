import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { CredentialShortDetails } from "../../../core/agent/services/credentialService.types";
import { CredentialsFilters } from "../../../ui/pages/Credentials/Credentials.types";
import { RootState } from "../../index";
import { FavouriteCredential } from "./credCache.types";

const initialState: {
  creds: CredentialShortDetails[];
  favourites: FavouriteCredential[];
  filters: CredentialsFilters;
} = {
  creds: [],
  favourites: [],
  filters: CredentialsFilters.All,
};
const credsCacheSlice = createSlice({
  name: "credsCache",
  initialState,
  reducers: {
    setCredsCache: (state, action: PayloadAction<CredentialShortDetails[]>) => {
      state.creds = action.payload;
    },
    updateOrAddCredsCache: (
      state,
      action: PayloadAction<CredentialShortDetails>
    ) => {
      const creds = state.creds.filter((cred) => cred.id !== action.payload.id);
      state.creds = [...creds, action.payload];
    },
    setFavouritesCredsCache: (
      state,
      action: PayloadAction<FavouriteCredential[]>
    ) => {
      state.favourites = action.payload;
    },
    addFavouritesCredsCache: (
      state,
      action: PayloadAction<FavouriteCredential>
    ) => {
      if (state.favourites.some((fav) => fav.id === action.payload.id)) return;
      state.favourites = [action.payload, ...state.favourites];
    },
    removeFavouritesCredsCache: (state, action: PayloadAction<string>) => {
      state.favourites = state.favourites.filter(
        (fav) => fav.id !== action.payload
      );
    },
    setCredentialsFilters: (
      state,
      action: PayloadAction<CredentialsFilters>
    ) => {
      state.filters = action.payload;
    },
    clearCredCache: () => initialState,
  },
});

export { credsCacheSlice, initialState };

export const {
  setCredsCache,
  updateOrAddCredsCache,
  setFavouritesCredsCache,
  addFavouritesCredsCache,
  removeFavouritesCredsCache,
  setCredentialsFilters,
  clearCredCache,
} = credsCacheSlice.actions;

const getCredsCache = (state: RootState) => state.credsCache.creds;
const getFavouritesCredsCache = (state: RootState) =>
  state.credsCache.favourites;
const getCredentialsFilters = (state: RootState) => state.credsCache.filters;

export { getCredentialsFilters, getCredsCache, getFavouritesCredsCache };
