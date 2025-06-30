import { ReactNode } from "react";
import { BackEventPriorityType } from "../../../globals/types";

interface TabLayoutProps {
  pageId?: string;
  customClass?: string;
  header?: boolean;
  backButton?: boolean;
  backButtonAction?: () => void;
  title?: string;
  doneLabel?: string;
  doneAction?: () => void;
  additionalButtons?: ReactNode;
  actionButton?: boolean;
  actionButtonAction?: () => void;
  actionButtonLabel?: string;
  children?: ReactNode;
  placeholder?: ReactNode;
  headerCustomContent?: ReactNode;
  hardwareBackButtonConfig?: {
    prevent: boolean;
    priority?: BackEventPriorityType;
    handler?: (processNextHandler: () => void) => void;
  };
}

export type { TabLayoutProps };
