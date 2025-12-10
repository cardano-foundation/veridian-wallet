import { AnyAction, ThunkAction } from "@reduxjs/toolkit";
import { Profile } from "../../store/reducers/profileCache";
import { SeedPhraseCacheProps } from "../../store/reducers/seedPhraseCache";
import { StateCacheProps } from "../../store/reducers/stateCache";
import { RootState } from "../../store";
import { RoutePath, TabsRoutePath } from "../paths";

interface PageState {
  recoveryWalletProgress?: boolean;
  seedPhrase?: string;
  bran?: string;
  nextRoute?: string;
  skipped?: boolean;
  isSetupProfile?: boolean;
  finishedSetup?: boolean;
  [key: string]: unknown;
}
interface PayloadProps {
  [key: string]: unknown;
}
interface StoreState {
  stateCache: StateCacheProps;
  seedPhraseCache?: SeedPhraseCacheProps;
  currentProfile?: Profile;
}

interface NextRoute {
  nextPath: (data: DataProps) => {
    pathname: RoutePath | TabsRoutePath | string;
  };
  updateRedux: ((
    data: DataProps
  ) => AnyAction | ThunkAction<void, RootState, undefined, AnyAction>)[];
}

interface DataProps {
  store: StoreState;
  state?: PageState;
  payload?: PayloadProps;
}

export type { DataProps, NextRoute, PageState, PayloadProps, StoreState };
