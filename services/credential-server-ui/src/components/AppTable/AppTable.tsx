import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TablePagination,
  TableRow,
} from "@mui/material";
import "./AppTable.scss";
import { AppTableBaseData, AppTableProps } from "./AppTable.types";
import { MIN_TABLE_WIDTH, ROWS_PER_PAGE_OPTIONS } from "./constants";
import { EnhancedTableHead } from "./EnhancedTableHead";

const AppTable = <T extends AppTableBaseData = AppTableBaseData>({
  rows,
  onRenderRow,
  headers,
  order,
  orderBy,
  onRequestSort,
  onSelectAll,
  selectedRows = [],
  pagination,
}: AppTableProps<T>) => {
  const rowPerPage = pagination?.rowsPerPage || ROWS_PER_PAGE_OPTIONS[0];
  const totalRows = pagination?.count || 0;

  const emptyRows = Array.from({ length: rowPerPage - rows.length }).fill(0);

  
  return (
    <TableContainer className="app-table">
      <Table
        sx={{ minWidth: MIN_TABLE_WIDTH }}
        aria-labelledby="tableTitle"
      >
        <EnhancedTableHead
          order={order}
          orderBy={orderBy as string}
          onRequestSort={onRequestSort}
          headers={headers}
          onSelectAll={onSelectAll}
          selectAllIndeterminate={
            selectedRows.length > 0 && selectedRows.length < totalRows
          }
          selectAll={totalRows > 0 && selectedRows.length === totalRows}
        />
        <TableBody>
          {rows.map(onRenderRow)}
          {emptyRows.map((_, index) => (
            <TableRow key={`empty-row-${index}`}>
              <TableCell colSpan={headers.length + 1 + (onSelectAll ? 1 : 0)} />
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {pagination && (
        <TablePagination
          rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
          {...pagination}
        />
      )}
    </TableContainer>
  );
};

export { AppTable };
