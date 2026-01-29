import { ReactNode } from "react";

interface SideSliderProps {
  isOpen: boolean;
  children: ReactNode;
  duration?: number;
  zIndex?: number;
  renderAsModal?: boolean;
  className?: string;
  animation?: boolean;
  onClose?: () => void;
}

export const ANIMATION_DURATION = 300;

export type { SideSliderProps };
