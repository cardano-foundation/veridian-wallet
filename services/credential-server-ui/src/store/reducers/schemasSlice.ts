import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { SchemaService } from "../../services/schemas";
import { Schema, SchemaDetail } from "./schemasSlice.types";
import { RootState } from "..";

interface SchemaState {
  schemas: Schema[];
  schemaDetailCache: Record<string, SchemaDetail>;
  status: "idle" | "loading" | "succeeded" | "failed";
  schemaDetailStatus: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
  schemaDetailError: string | null;
}

const initialState: SchemaState = {
  schemas: [],
  schemaDetailCache: {},
  status: "idle",
  error: null,
  schemaDetailError: null,
  schemaDetailStatus: "idle",
};

export const fetchSchemas = createAsyncThunk(
  "schemas/fetchSchema",
  async () => {
    const responses = await SchemaService.getSchemas();
    return responses.data.data;
  }
);

export const fetchSchemaDetail = createAsyncThunk<
  SchemaDetail,
  string,
  { state: RootState }
>("schemas/fetchSchemaDetail", async (id: string) => {
  const responses = await SchemaService.getSchema(id);
  return responses.data;
});

const schemasSlices = createSlice({
  name: "schemas",
  initialState,
  reducers: {
    clearFetchSchemaError: (state) => {
      state.error = "";
    },
    clearFetchSchemaDetailError: (state) => {
      state.schemaDetailError = "";
    },
  },
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

    builder
      .addCase(fetchSchemaDetail.pending, (state) => {
        state.schemaDetailStatus = "loading";
      })
      .addCase(fetchSchemaDetail.fulfilled, (state, action) => {
        state.schemaDetailStatus = "succeeded";
        state.schemaDetailCache[action.payload.$id] = action.payload;
      })
      .addCase(fetchSchemaDetail.rejected, (state, action) => {
        state.schemaDetailStatus = "failed";
        state.error = action.error.message || null;
      });
  },
});

export const { clearFetchSchemaDetailError, clearFetchSchemaError } =
  schemasSlices.actions;

export default schemasSlices.reducer;
