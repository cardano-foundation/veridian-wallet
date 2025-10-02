import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { config } from "../../config";
import { Contact } from "../../pages/Connections/components/ConnectionsTable/ConnectionsTable.types";
import {
  Credential,
  PresentationRequestData,
  PresentationRequestStatus,
} from "./connectionsSlice.types";

interface ConnectionsState {
  contacts: Contact[];
  credentials: Credential[];
  presentationRequests: PresentationRequestData[];
  status: "idle" | "loading" | "succeeded" | "failed";
  error: string | null;
}

const initialState: ConnectionsState = {
  contacts: [],
  credentials: [],
  presentationRequests: [],
  status: "idle",
  error: null,
};

export const fetchContacts = createAsyncThunk(
  "connections/fetchContacts",
  async () => {
    const response = await axios.get(
      `${config.endpoint}${config.path.contacts}`
    );
    return response.data.data;
  }
);

export const fetchContactCredentials = createAsyncThunk(
  "connections/fetchContactCredentials",
  async (contactId: string) => {
    const response = await axios.get(
      `${config.endpoint}${config.path.contactCredentials}`,
      {
        params: { contactId },
      }
    );
    return { contactId, credentials: response.data.data };
  }
);

export const fetchPresentationRequests = createAsyncThunk(
  "connections/fetchPresentationRequests",
  async () => {
    const response = await axios.get(
      `${config.endpoint}${config.path.getPresentationRequests}`
    );
    return response.data.data;
  }
);

const connectionsSlice = createSlice({
  name: "connections",
  initialState,
  reducers: {
    savePresentationRequest: (
      state,
      action: PayloadAction<PresentationRequestData>
    ) => {
      state.presentationRequests.push(action.payload);
    },
    updatePresentationStatus: (
      state,
      action: PayloadAction<{ id: string; status: PresentationRequestStatus }>
    ) => {
      const request = state.presentationRequests.find(
        (req) => req.id === action.payload.id
      );
      if (request) {
        request.status = action.payload.status;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchContacts.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchContacts.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.contacts = action.payload;
      })
      .addCase(fetchContacts.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.error.message || null;
      })
      .addCase(fetchContactCredentials.fulfilled, (state, action) => {
        const { contactId, credentials } = action.payload;
        const currentCredentials = state.credentials.filter(
          (item) => item.contactId !== contactId
        );
        state.credentials = currentCredentials.concat(
          credentials.map((cred: Credential) => ({ ...cred, contactId }))
        );
      })
      .addCase(fetchPresentationRequests.fulfilled, (state, action) => {
        const payload = action.payload.map((request: any) => {
          return {
            ...request,
            attributes: request.attributes,
          };
        });

        state.presentationRequests = payload;
      });
  },
});

export const { savePresentationRequest, updatePresentationStatus } =
  connectionsSlice.actions;

export default connectionsSlice.reducer;
