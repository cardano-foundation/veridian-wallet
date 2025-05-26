import { ReactNode } from "react";

interface SlideItem {
  image: string;
  description?: string;
  title?: string;
  lottie?: ReactNode;
}

export type { SlideItem };
