import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../../index";
import { NotificationsPreferencesState } from "./notificationsPreferences.types";

const initialState: NotificationsPreferencesState = {
  enabled: false,
  configured: false,
};

const notificationsPreferencesSlice = createSlice({
  name: "notificationsPreferences",
  initialState,
  reducers: {
    setNotificationsEnabled: (state, action: PayloadAction<boolean>) => {
      state.enabled = action.payload;
    },
    setNotificationsConfigured: (state, action: PayloadAction<boolean>) => {
      state.configured = action.payload;
    },
    clearNotificationsPreferences: () => initialState,
  },
});

const {
  setNotificationsEnabled,
  setNotificationsConfigured,
  clearNotificationsPreferences,
} = notificationsPreferencesSlice.actions;

const getNotificationsPreferences = (state: RootState) =>
  state.notificationsPreferences;

export {
  notificationsPreferencesSlice,
  setNotificationsEnabled,
  setNotificationsConfigured,
  clearNotificationsPreferences,
  getNotificationsPreferences,
};
