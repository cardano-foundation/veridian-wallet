import { ReactNode } from "react";

interface InfoCardProps {
  content?: string | null;
  className?: string;
  icon?: string;
  danger?: boolean;
  children?: ReactNode;
}

export type { InfoCardProps };
