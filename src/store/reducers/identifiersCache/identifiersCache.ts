import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { IdentifierShortDetails } from "../../../core/agent/services/identifier.types";
import { RootState } from "../../index";
import {
  FavouriteIdentifier,
  IdentifierCacheState,
  MultiSigGroup,
} from "./identifiersCache.types";
import { IdentifiersFilters } from "../../../ui/pages/Identifiers/Identifiers.types";

const initialState: IdentifierCacheState = {
  identifiers: {},
  favourites: [],
  multiSigGroup: undefined,
  openMultiSigId: undefined,
  filters: IdentifiersFilters.All,
};
const identifiersCacheSlice = createSlice({
  name: "identifiersCache",
  initialState,
  reducers: {
    setIdentifiersCache: (
      state,
      action: PayloadAction<IdentifierShortDetails[]>
    ) => {
      const newIdentifiers = action.payload.reduce(
        (acc: Record<string, IdentifierShortDetails>, identifier) => {
          acc[identifier.id] = identifier;
          return acc;
        },
        {}
      );

      state.identifiers = newIdentifiers;
    },
    updateOrAddIdentifiersCache: (
      state,
      action: PayloadAction<IdentifierShortDetails>
    ) => {
      state.identifiers = {
        ...state.identifiers,
        [action.payload.id]: action.payload,
      };
    },
    addGroupIdentifierCache: (
      state,
      action: PayloadAction<IdentifierShortDetails>
    ) => {
      delete state.identifiers[action.payload.groupMemberPre!];
      // In case it was already added, we want to avoid inserting a "PENDING" one that could be complete already
      if (!state.identifiers[action.payload.id]) {
        state.identifiers = {
          ...state.identifiers,
          [action.payload.id]: action.payload,
        };
      }
    },
    updateCreationStatus: (
      state,
      action: PayloadAction<
        Pick<IdentifierShortDetails, "id" | "creationStatus">
      >
    ) => {
      const identifier = state.identifiers[action.payload.id];

      if (identifier) {
        identifier.creationStatus = action.payload.creationStatus;

        state.identifiers = {
          ...state.identifiers,
          [action.payload.id]: identifier,
        };
      }
    },
    removeIdentifierCache: (state, action: PayloadAction<string>) => {
      delete state.identifiers[action.payload];
    },
    setFavouritesIdentifiersCache: (
      state,
      action: PayloadAction<FavouriteIdentifier[]>
    ) => {
      state.favourites = action.payload;
    },
    addFavouriteIdentifierCache: (
      state,
      action: PayloadAction<FavouriteIdentifier>
    ) => {
      if (state.favourites.some((fav) => fav.id === action.payload.id)) return;
      state.favourites = [action.payload, ...state.favourites];
    },
    removeFavouriteIdentifierCache: (state, action: PayloadAction<string>) => {
      state.favourites = state.favourites.filter(
        (fav) => fav.id !== action.payload
      );
    },
    setMultiSigGroupCache: (
      state,
      action: PayloadAction<MultiSigGroup | undefined>
    ) => {
      state.multiSigGroup = action.payload;
    },
    setOpenMultiSigId: (state, action: PayloadAction<string | undefined>) => {
      state.openMultiSigId = action.payload;
    },
    setScanGroupId: (state, action: PayloadAction<string | undefined>) => {
      state.scanGroupId = action.payload;
    },
    setIdentifiersFilters: (
      state,
      action: PayloadAction<IdentifiersFilters>
    ) => {
      state.filters = action.payload;
    },
    setIndividualFirstCreate: (state, action: PayloadAction<boolean>) => {
      state.individualFirstCreate = action.payload;
    },
    clearIdentifierCache: () => initialState,
  },
});

export { identifiersCacheSlice, initialState };

export const {
  setIdentifiersCache,
  setFavouritesIdentifiersCache,
  updateOrAddIdentifiersCache,
  updateCreationStatus,
  addFavouriteIdentifierCache,
  removeFavouriteIdentifierCache,
  setMultiSigGroupCache,
  setOpenMultiSigId,
  setScanGroupId,
  setIdentifiersFilters,
  removeIdentifierCache,
  addGroupIdentifierCache,
  clearIdentifierCache,
  setIndividualFirstCreate,
} = identifiersCacheSlice.actions;

const getIdentifiersCache = (state: RootState) =>
  state.identifiersCache?.identifiers;

const getFavouritesIdentifiersCache = (state: RootState) =>
  state.identifiersCache.favourites;

const getMultiSigGroupCache = (state: RootState) =>
  state.identifiersCache?.multiSigGroup;

const getOpenMultiSig = (state: RootState) =>
  state.identifiersCache?.openMultiSigId;

const getScanGroupId = (state: RootState) =>
  state.identifiersCache?.scanGroupId;

const getIdentifiersFilters = (state: RootState) =>
  state.identifiersCache.filters;

const getIndividualFirstCreateSetting = (state: RootState) =>
  state.identifiersCache.individualFirstCreate;

export {
  getFavouritesIdentifiersCache,
  getIdentifiersCache,
  getMultiSigGroupCache,
  getOpenMultiSig,
  getScanGroupId,
  getIdentifiersFilters,
  getIndividualFirstCreateSetting,
};
