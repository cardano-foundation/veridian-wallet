import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { RootState } from "../../index";
import { BiometricsCacheProps } from "./biometricsCache.types";

const initialState: BiometricsCacheProps = {
  enabled: false,
};

const biometricsCacheSlice = createSlice({
  name: "biometricsCache",
  initialState,
  reducers: {
    setEnableBiometricsCache: (state, action: PayloadAction<boolean>) => {
      state.enabled = action.payload;
    },
    clearBiometricsCache: () => initialState,
  },
});

const { setEnableBiometricsCache, clearBiometricsCache } =
  biometricsCacheSlice.actions;

const getBiometricsCache = (state: RootState) => state.biometricsCache;

export {
  initialState,
  setEnableBiometricsCache,
  getBiometricsCache,
  biometricsCacheSlice,
  clearBiometricsCache,
};
