interface TileProps {
  icon: string;
  chevron?: boolean;
  badge?: string;
  title: string;
  text: string;
  className?: string;
  handleTileClick?: () => void;
}

export type { TileProps };
