import { CardListViewType } from "../../../ui/components/SwitchCardView";

interface ViewType {
  viewType: CardListViewType | null;
  favouriteIndex: number;
}

interface ViewTypeCacheProps {
  credential: ViewType;
}
export type { ViewTypeCacheProps };
