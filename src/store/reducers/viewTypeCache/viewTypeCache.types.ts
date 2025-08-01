import { CardListViewType } from "../../../ui/components/SwitchCardView";

interface FavouriteCredential {
  id: string;
  time: number;
}

interface ViewType {
  viewType: CardListViewType | null;
  favouriteIndex: number;
  favourites: FavouriteCredential[];
  filters: CredentialsFilters;
}

interface ViewTypeCacheProps {
  credential: ViewType;
}

enum CredentialsFilters {
  All = "all",
  Individual = "individual",
  Group = "group",
}

export type { ViewTypeCacheProps, FavouriteCredential };

export { CredentialsFilters };
