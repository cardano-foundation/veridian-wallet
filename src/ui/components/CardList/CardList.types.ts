import { ReactNode, MouseEvent as ReactMouseEvent } from "react";

interface CardItem<T> {
  title: string;
  subtitle?: string;
  image?: string;
  startSlot?: ReactNode;
  id: string | number;
  data: T;
}

interface CardItemProps<T> {
  index: number;
  card: CardItem<T>;
  hiddenImage?: boolean;
  onRenderCardAction?: (data: T) => ReactNode;
  onCardClick?: (data: T, e: ReactMouseEvent<HTMLElement, MouseEvent>) => void;
  onRenderEndSlot?: (data: T) => ReactNode;
  onRenderStartSlot?: (data: T, index: number) => ReactNode;
}

interface CardListProps<T extends object = object>
  extends Omit<CardItemProps<T>, "card" | "index"> {
  data: CardItem<T>[];
  lines?: "full" | "inset" | "none";
  className?: string;
  rounded?: boolean;
  testId?: string;
}

export type { CardItem, CardListProps, CardItemProps };
