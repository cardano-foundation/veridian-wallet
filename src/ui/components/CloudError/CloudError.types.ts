import { ReactNode } from "react";

interface CloudErrorProps {
  pageId: string;
  header?: ReactNode;
  children?: ReactNode;
  content?: string;
}

export type { CloudErrorProps };
