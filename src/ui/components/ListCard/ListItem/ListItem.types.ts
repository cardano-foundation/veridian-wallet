import React from "react";
import { FlatBorderType } from "../../CardDetails/CardDetailsBlock";

interface ListItemProps {
  icon?: string;
  onClick?: () => void;
  testId?: string;
  className?: string;
  children?: React.ReactNode;
  index?: number;
  label?: string;
  actionIcon?: React.ReactNode;
  note?: string;
  href?: string;
  title?: string;
  flatBorder?: FlatBorderType;
  copyContent?: string;
  endSlotIcon?: string;
  showStartIcon?: boolean;
}

export type { ListItemProps };
