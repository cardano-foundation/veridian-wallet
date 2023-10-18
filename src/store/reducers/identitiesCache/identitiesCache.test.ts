import { PayloadAction } from "@reduxjs/toolkit";
import {
  identitiesCacheSlice,
  getIdentitiesCache,
  setIdentitiesCache,
} from "./identitiesCache";
import { RootState } from "../../index";
import {
  IdentifierShortDetails,
  IdentifierType,
} from "../../../core/agent/agent.types";

describe("identitiesCacheSlice", () => {
  const initialState = {
    identities: [],
  };
  it("should return the initial state", () => {
    expect(
      identitiesCacheSlice.reducer(undefined, {} as PayloadAction)
    ).toEqual(initialState);
  });

  it("should handle setIdentitiesCache", () => {
    const identities: IdentifierShortDetails[] = [
      {
        id: "id-1",
        method: IdentifierType.KEY,
        displayName: "example-name",
        createdAtUTC: "example-date",
        colors: ["#92FFC0", "#47FF94"],
        theme: 0,
      },
    ];
    const newState = identitiesCacheSlice.reducer(
      initialState,
      setIdentitiesCache(identities)
    );
    expect(newState.identities).toEqual(identities);
  });
});

describe("getIdentitiesCache", () => {
  it("should return the identities cache from RootState", () => {
    const state = {
      identitiesCache: {
        identities: [
          {
            id: "id-1",
            method: IdentifierType.KEY,
            displayName: "example-name-1",
            createdAtUTC: "example-date",
            colors: ["#92FFC0", "#47FF94"],
          },
          {
            id: "id-2",
            method: IdentifierType.KEY,
            displayName: "example-name-2",
            createdAtUTC: "example-date",
            colors: ["#FFBC60", "#FFA21F"],
          },
        ],
      },
    } as RootState;
    const identitiesCache = getIdentitiesCache(state);
    expect(identitiesCache).toEqual(state.identitiesCache.identities);
  });
});
