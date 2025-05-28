import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";
import { config } from "../../config";
import { Schema } from "./schemasSlice.types";

interface SchemaState {
  schemas: Schema[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: SchemaState = {
  schemas: [],
  status: "idle",
  error: null,
};

export const fetchSchemas = createAsyncThunk(
  "schemas/fetchSchema",
  async () => {
    const responses = await axios.get(
      `${config.endpoint}${config.path.schemas}`
    );

    return responses.data.data;
  }
);

const schemasSlices = createSlice({
  name: "schemas",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSchemas.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchSchemas.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.schemas = action.payload;
      })
      .addCase(fetchSchemas.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || null;
      });
  },
});

export default schemasSlices.reducer;
