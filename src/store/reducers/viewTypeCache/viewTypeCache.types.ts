import { CardListViewType } from "../../../ui/components/SwitchCardView";

interface FavouriteCredential {
  id: string;
  time: number;
}

interface ViewType {
  viewType: CardListViewType | null;
  favouriteIndex: number;
  favourites: FavouriteCredential[];
}

interface ViewTypeCacheProps {
  credential: ViewType;
}

export type { ViewTypeCacheProps, FavouriteCredential };
