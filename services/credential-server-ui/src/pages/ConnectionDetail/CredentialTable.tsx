import { MoreVert } from "@mui/icons-material";
import {
  Box,
  Button,
  IconButton,
  Paper,
  TableCell,
  TableRow,
  Tooltip,
} from "@mui/material";
import { enqueueSnackbar, VariantType } from "notistack";
import { useState } from "react";
import { AppTable, useTable } from "../../components/AppTable";
import { AppTableHeader } from "../../components/AppTable/AppTable.types";
import { DropdownMenu } from "../../components/DropdownMenu";
import { PopupModal } from "../../components/PopupModal";
import { i18n } from "../../i18n";
import { CredentialService } from "../../services";
import { useAppDispatch } from "../../store/hooks";
import { fetchContactCredentials } from "../../store/reducers/connectionsSlice";
import { formatDate } from "../../utils/dateFormatter";
import {
  CredentialTableProps,
  CredentialTableRow,
} from "./ConnectionDetail.types";
import { createMenuItems } from "./menuItems";
const headers: AppTableHeader<CredentialTableRow>[] = [
  {
    id: "name",
    label: i18n.t("pages.connectiondetail.table.headers.name"),
  },
  {
    id: "date",
    disablePadding: false,
    label: i18n.t("pages.connectiondetail.table.headers.issueDate"),
  },
  {
    id: "status",
    disablePadding: false,
    label: i18n.t("pages.connectiondetail.table.headers.status"),
  },
];

const CredentialTable = ({ credentials, contactId }: CredentialTableProps) => {
  const dispatch = useAppDispatch();
  const [openModal, setOpenModal] = useState(false);
  const [revokeCredItem, setRevokeCredItem] =
    useState<CredentialTableRow | null>(null);
  const tableRows: CredentialTableRow[] = credentials.map((row) => ({
    id: row.status.i,
    name: row.schema.title,
    date: new Date(row.status.dt).getTime(),
    status: Number(row.status.s),
    data: row,
  }));

  const {
    order,
    orderBy,
    selected,
    page,
    rowsPerPage,
    handleRequestSort,
    handleChangePage,
    handleChangeRowsPerPage,
    visibleRows,
  } = useTable(tableRows, "name");

  const triggerToast = (message: string, variant: VariantType) => {
    enqueueSnackbar(message, {
      variant,
      anchorOrigin: { vertical: "top", horizontal: "center" },
    });
  };

  const viewCred = () => {};

  const revokeCred = async () => {
    setOpenModal(false);
    if (!contactId || !revokeCredItem) return;

    setRevokeCredItem(null);
    try {
      const response = await CredentialService.revoke(
        contactId,
        revokeCredItem.id
      );
      if (response.status === 200) {
        triggerToast(
          i18n.t("pages.connectiondetail.table.toast.success"),
          "success"
        );
      } else {
        triggerToast(
          i18n.t("pages.connectiondetail.table.toast.error"),
          "error"
        );
      }

      dispatch(fetchContactCredentials(contactId));
    } catch (error) {
      triggerToast(i18n.t("pages.connectiondetail.table.toast.error"), "error");
      console.error("Error deleting contact:", error);
    }
  };

  const openRevokeConfirm = (cred: CredentialTableRow) => {
    setRevokeCredItem(cred);
    setOpenModal(true);
  };

  return (
    <>
      <Paper
        sx={{
          borderRadius: "1rem",
          overflow: "hidden",
          boxShadow:
            "0.25rem 0.25rem 1.25rem 0 rgba(var(--text-color-rgb), 0.16)",
          flex: 1,
        }}
        className="credential-table"
      >
        <AppTable
          order={order}
          rows={visibleRows}
          onRenderRow={(row, index) => {
            const isItemSelected = selected.includes(row.id);
            const labelId = `enhanced-table-checkbox-${index}`;
            const isRevoked = row.status !== 0;

            return (
              <TableRow
                hover
                role="checkbox"
                aria-checked={isItemSelected}
                tabIndex={-1}
                key={row.id}
                selected={isItemSelected}
                className="table-row"
              >
                <TableCell
                  component="th"
                  id={labelId}
                  scope="row"
                >
                  {row.name}
                </TableCell>
                <TableCell align="left">
                  {formatDate(new Date(row.date))}
                </TableCell>
                <TableCell align="left">
                  <Box
                    sx={(theme) => ({
                      background: isRevoked
                        ? theme.palette.error.main
                        : theme.palette.success.light,
                      color: isRevoked
                        ? theme.palette.error.contrastText
                        : theme.palette.success.main,
                      padding: "0.25rem 0.75rem",
                      width: "fit-content",
                      fontSize: "0.75rem",
                      lineHeight: "1.25rem",
                      borderRadius: "0.5rem",
                    })}
                  >
                    {!isRevoked
                      ? i18n.t("pages.connectiondetail.table.status.issued")
                      : i18n.t("pages.connectiondetail.table.status.revoked")}
                  </Box>
                </TableCell>
                <TableCell align="left">
                  <DropdownMenu
                    button={
                      <Tooltip
                        title={i18n.t("pages.connections.actions")}
                        placement="top"
                      >
                        <IconButton aria-label="actions">
                          <MoreVert />
                        </IconButton>
                      </Tooltip>
                    }
                    menuItems={createMenuItems(
                      row,
                      viewCred,
                      openRevokeConfirm
                    )}
                  />
                </TableCell>
              </TableRow>
            );
          }}
          onRequestSort={handleRequestSort}
          orderBy={orderBy}
          headers={headers}
          pagination={{
            component: "div",
            count: credentials.length,
            rowsPerPage: rowsPerPage,
            page: page,
            onPageChange: handleChangePage,
            onRowsPerPageChange: handleChangeRowsPerPage,
          }}
        />
      </Paper>
      <PopupModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        title={i18n.t("pages.connectiondetail.table.confirm.title")}
        body={i18n.t("pages.connectiondetail.table.confirm.body")}
        footer={
          <>
            <Button
              variant="contained"
              aria-label="cancel delete connection"
              onClick={() => setOpenModal(false)}
            >
              {i18n.t("pages.connectiondetail.table.confirm.cancel")}
            </Button>
            <Button
              variant="contained"
              aria-label="confirm delete connection"
              onClick={revokeCred}
              color="error"
            >
              {i18n.t("pages.connectiondetail.table.confirm.confirm")}
            </Button>
          </>
        }
      />
    </>
  );
};

export { CredentialTable };
