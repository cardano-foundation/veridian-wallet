import { TablePaginationProps } from "@mui/material";
import { ReactNode } from "react";

interface AppTableBaseData {
  id: string;
}

interface AppTableHeader<T extends AppTableBaseData> {
  id: keyof T;
  label: string;
  disablePadding?: boolean;
  onClick?: (row: keyof T) => void;
}

interface EnhancedTableHeaderProps<
  T extends AppTableBaseData = AppTableBaseData
> {
  onRequestSort: (property: keyof T) => void;
  order: "asc" | "desc";
  orderBy: string;
  headers: AppTableHeader<T>[];
  selectAllIndeterminate?: boolean;
  selectAll?: boolean;
  onSelectAll?: (
    event: React.ChangeEvent<HTMLInputElement>,
    checked: boolean
  ) => void;
}

interface AppTableProps<T extends AppTableBaseData>
  extends Omit<
    EnhancedTableHeaderProps<T>,
    "selectAll" | "selectAllIndeterminate"
  > {
  rows: T[];
  onRenderRow: (row: T, index: number) => ReactNode;
  pagination?: TablePaginationProps;
  selectedRows?: string[];
}

export type {
  AppTableBaseData,
  AppTableHeader,
  AppTableProps,
  EnhancedTableHeaderProps,
};
