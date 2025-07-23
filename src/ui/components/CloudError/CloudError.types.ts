import { ReactNode } from "react";

interface CloudErrorProps {
  pageId: string;
  header?: ReactNode;
  children?: ReactNode;
  content?: string;
  type?: "error" | "warning";
}

export type { CloudErrorProps };
