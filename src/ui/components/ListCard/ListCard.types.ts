import React from "react";

interface ListCardProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  testId?: string;
  className?: string;
}

export type { ListCardProps };
