import {
  DoDisturbOnOutlined,
  GroupOutlined,
  MoreVert,
} from "@mui/icons-material";
import {
  Box,
  Button,
  IconButton,
  Paper,
  TableCell,
  TableRow,
  Tooltip,
} from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router";
import { AppTable, useTable } from "../../components/AppTable";
import { AppTableHeader } from "../../components/AppTable/AppTable.types";
import { DropdownMenu } from "../../components/DropdownMenu";
import { RoleIndex } from "../../components/NavBar/constants/roles";
import { PopupModal } from "../../components/PopupModal";
import { RoutePath } from "../../const/route";
import { i18n } from "../../i18n";
import { CredentialService } from "../../services";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { getRoleView } from "../../store/reducers";
import { fetchContactCredentials } from "../../store/reducers/connectionsSlice";
import { formatDate, formatDateTime } from "../../utils/dateFormatter";
import {
  CredentialTableProps,
  CredentialTableRow,
} from "./CredentialDetails.types";
import { triggerToast } from "../../utils/toast";
import { FilterData } from "../../components/FilterBar/FilterBar.types";
import { filter, FilterBar } from "../../components/FilterBar";

const headers: AppTableHeader<CredentialTableRow>[] = [
  {
    id: "name",
    label: i18n.t("pages.credentialDetails.table.headers.name"),
  },
  {
    id: "attribute",
    label: i18n.t("pages.connectionDetails.table.headers.attribute"),
  },
  {
    id: "identifier",
    disablePadding: false,
    label: i18n.t("pages.credentialDetails.table.headers.identifier"),
  },
  {
    id: "credentialId",
    disablePadding: false,
    label: i18n.t("pages.credentialDetails.table.headers.credentialId"),
  },
  {
    id: "date",
    disablePadding: false,
    label: i18n.t("pages.credentialDetails.table.headers.issueDate"),
  },
  {
    id: "status",
    disablePadding: false,
    label: i18n.t("pages.credentialDetails.table.headers.status"),
  },
];

const CredentialsTable = ({ credentials }: CredentialTableProps) => {
  const roleViewIndex = useAppSelector(getRoleView) as RoleIndex;
  const contacts = useAppSelector((state) => state.connections.contacts);
  const dispatch = useAppDispatch();
  const [openModal, setOpenModal] = useState(false);
  const [revokeCredItem, setRevokeCredItem] =
    useState<CredentialTableRow | null>(null);
  const [filterData, setFilterData] = useState<FilterData>({
    startDate: null,
    endDate: null,
    keyword: "",
  });
  const nav = useNavigate();

  const tableRows: CredentialTableRow[] = credentials.map((row) => {
    const contact = contacts.find((item) => item.id === row.contactId)?.alias;

    return {
      id: row.status.i,
      name: contact || "",
      attribute: Object.values(row.sad.a)[2],
      identifier: row.contactId,
      credentialId: row.schema.$id,
      date: new Date(row.status.dt).getTime(),
      status: Number(row.status.s),

      data: row,
    };
  });

  const filterRows = filter(tableRows, filterData, { date: "date" });

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
  } = useTable(filterRows, "date");

  const revokeCred = async () => {
    setOpenModal(false);
    if (!revokeCredItem) return;

    setRevokeCredItem(null);
    try {
      const response = await CredentialService.revoke(
        revokeCredItem.data.contactId,
        revokeCredItem.id
      );
      if (response.status === 200) {
        triggerToast(
          i18n.t("pages.credentialDetails.table.toast.success"),
          "success"
        );
      } else {
        triggerToast(
          i18n.t("pages.credentialDetails.table.toast.error"),
          "error"
        );
      }

      dispatch(fetchContactCredentials(revokeCredItem.data.contactId));
    } catch (error) {
      triggerToast(
        i18n.t("pages.credentialDetails.table.toast.error"),
        "error"
      );
      console.error("Error deleting contact:", error);
    }
  };

  const openRevokeConfirm = (cred: CredentialTableRow) => {
    setRevokeCredItem(cred);
    setOpenModal(true);
  };

  const viewConnection = (cred: CredentialTableRow) => {
    nav(RoutePath.ConnectionDetails.replace(":id", cred.identifier));
  };

  return (
    <Box flex={1}>
      <FilterBar
        onChange={setFilterData}
        totalFound={filterRows.length}
      />
      <Paper className="credentials-table">
        <AppTable
          order={order}
          rows={visibleRows}
          onRenderRow={(row, index) => {
            const isItemSelected = selected.includes(row.id);
            const labelId = `enhanced-table-checkbox-${index}`;
            const isRevoked = row.status !== 0;
            const attributeKey = Object.keys(row.data.sad.a)[2];

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
                  <Tooltip
                    title={row.name}
                    placement="top"
                  >
                    <span>{row.name}</span>
                  </Tooltip>
                </TableCell>
                <TableCell align="left">
                  <Tooltip
                    title={`${attributeKey}: ${row.attribute}`}
                    placement="top"
                  >
                    <span>{row.attribute}</span>
                  </Tooltip>
                </TableCell>
                <TableCell align="left">
                  <Tooltip
                    title={row.identifier}
                    placement="top"
                  >
                    <span>
                      {row.identifier.substring(0, 4)}...
                      {row.identifier.slice(-4)}
                    </span>
                  </Tooltip>
                </TableCell>
                <TableCell align="left">
                  <Tooltip
                    title={row.credentialId}
                    placement="top"
                  >
                    <span>
                      {row.credentialId.substring(0, 4)}...
                      {row.credentialId.slice(-4)}
                    </span>
                  </Tooltip>
                </TableCell>
                <TableCell align="left">
                  <Tooltip
                    title={formatDateTime(new Date(row.date))}
                    placement="top"
                  >
                    <span>{formatDate(new Date(row.date))}</span>
                  </Tooltip>
                </TableCell>
                <TableCell align="left">
                  <Box className={`label ${isRevoked ? "revoked" : "issued"}`}>
                    {!isRevoked
                      ? i18n.t("pages.credentialDetails.table.status.issued")
                      : i18n.t("pages.credentialDetails.table.status.revoked")}
                  </Box>
                </TableCell>
                <TableCell align="left">
                  <DropdownMenu
                    button={
                      <Tooltip
                        title={i18n.t(
                          "pages.credentialDetails.table.menu.actions"
                        )}
                        placement="top"
                      >
                        <IconButton aria-label="actions">
                          <MoreVert />
                        </IconButton>
                      </Tooltip>
                    }
                    menuItems={[
                      {
                        label: i18n.t(
                          "pages.credentialDetails.table.menu.view"
                        ),
                        action: () => viewConnection(row),
                        icon: <GroupOutlined />,
                        className: "icon-left",
                      },
                      ...(roleViewIndex === RoleIndex.ISSUER
                        ? [
                            {
                              className: "divider",
                            },
                            {
                              label: i18n.t(
                                "pages.credentialDetails.table.menu.delete"
                              ),
                              action: () => openRevokeConfirm(row),
                              icon: <DoDisturbOnOutlined />,
                              className: "icon-left action-delete",
                              disabled: row.status !== 0,
                            },
                          ]
                        : []),
                    ]}
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
            count: filterRows.length,
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
        title={i18n.t("pages.credentialDetails.table.confirm.title")}
        description={i18n.t("pages.credentialDetails.table.confirm.body")}
        footer={
          <>
            <Button
              variant="contained"
              aria-label="cancel delete connection"
              onClick={() => setOpenModal(false)}
              className="neutral-button"
            >
              {i18n.t("pages.credentialDetails.table.confirm.cancel")}
            </Button>
            <Button
              variant="contained"
              aria-label="confirm delete connection"
              onClick={revokeCred}
            >
              {i18n.t("pages.credentialDetails.table.confirm.confirm")}
            </Button>
          </>
        }
      />
    </Box>
  );
};

export { CredentialsTable as CredentialTable };
