import { ReactNode } from "react";

interface ScrollablePageLayoutProps {
  header?: ReactNode;
  pageId?: string;
  children?: ReactNode;
  customClass?: string;
}

export type { ScrollablePageLayoutProps };
