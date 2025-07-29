import { IdentifierShortDetails } from "../../core/agent/services/identifier.types";
import { SeedPhraseCacheProps } from "../../store/reducers/seedPhraseCache";
import { StateCacheProps } from "../../store/reducers/stateCache";
import { RoutePath, TabsRoutePath } from "../paths";

interface PageState {
  [key: string]: any;
}
interface PayloadProps {
  [key: string]: any;
}
interface StoreState {
  stateCache: StateCacheProps;
  seedPhraseCache?: SeedPhraseCacheProps;
  identifiers?: Record<string, IdentifierShortDetails>;
}

interface NextRoute {
  nextPath: (data: DataProps) => {
    pathname: RoutePath | TabsRoutePath | string;
  };
  updateRedux: any[];
}

interface DataProps {
  store: StoreState;
  state?: PageState;
  payload?: PayloadProps;
}

export type { DataProps, NextRoute, PageState, PayloadProps, StoreState };
