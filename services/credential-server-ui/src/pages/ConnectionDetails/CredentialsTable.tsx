import {
  BadgeOutlined,
  DoDisturbOnOutlined,
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
import { filter, FilterBar } from "../../components/FilterBar";
import { FilterData } from "../../components/FilterBar/FilterBar.types";
import { RoleIndex } from "../../components/NavBar/constants/roles";
import { PopupModal } from "../../components/PopupModal";
import { RoutePath } from "../../const/route";
import { i18n } from "../../i18n";
import { CredentialService } from "../../services";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { getRoleView } from "../../store/reducers";
import { fetchContactCredentials } from "../../store/reducers/connectionsSlice";
import { formatDate, formatDateTime } from "../../utils/dateFormatter";
import { triggerToast } from "../../utils/toast";
import {
  CredentialsTableProps,
  CredentialsTableRow,
} from "./ConnectionDetails.types";
const headers: AppTableHeader<CredentialsTableRow>[] = [
  {
    id: "name",
    label: i18n.t("pages.connectionDetails.table.headers.name"),
  },
  {
    id: "credentialId",
    label: i18n.t("pages.connectionDetails.table.headers.credentialId"),
  },
  {
    id: "attribute",
    label: i18n.t("pages.connectionDetails.table.headers.attribute"),
  },
  {
    id: "date",
    disablePadding: false,
    label: i18n.t("pages.connectionDetails.table.headers.issueDate"),
  },
  {
    id: "status",
    disablePadding: false,
    label: i18n.t("pages.connectionDetails.table.headers.status"),
  },
];

const CredentialsTable = ({
  credentials,
  contactId,
}: CredentialsTableProps) => {
  const nav = useNavigate();
  const roleViewIndex = useAppSelector(getRoleView) as RoleIndex;
  const dispatch = useAppDispatch();
  const [openModal, setOpenModal] = useState(false);
  const [revokeCredItem, setRevokeCredItem] =
    useState<CredentialsTableRow | null>(null);

  const [filterData, setFilterData] = useState<FilterData>({
    startDate: null,
    endDate: null,
    keyword: "",
  });
  const tableRows: CredentialsTableRow[] = credentials.map((row) => ({
    id: row.status.i,
    name: row.schema.title,
    credentialId: row.schema.$id,
    attribute: Object.values(row.sad.a)[2],
    date: new Date(row.status.dt).getTime(),
    status: Number(row.status.s),
    data: row,
  }));

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

  const viewCredTemplate = (id: string) => {
    nav(`${RoutePath.Credentials}/${id}`);
  };

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
          i18n.t("pages.connectionDetails.table.toast.success"),
          "success"
        );
      } else {
        triggerToast(
          i18n.t("pages.connectionDetails.table.toast.error"),
          "error"
        );
      }

      dispatch(fetchContactCredentials(contactId));
    } catch (error) {
      triggerToast(
        i18n.t("pages.connectionDetails.table.toast.error"),
        "error"
      );
      console.error("Error deleting contact:", error);
    }
  };

  const openRevokeConfirm = (cred: CredentialsTableRow) => {
    setRevokeCredItem(cred);
    setOpenModal(true);
  };

  return (
    <Box className="credential-table-container">
      <FilterBar
        onChange={setFilterData}
        totalFound={filterRows.length}
      />
      <Paper className="credentials-table">
        <AppTable
          order={order}
          rows={visibleRows}
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
                    title={`${attributeKey}: ${row.attribute}`}
                    placement="top"
                  >
                    <span>{row.attribute}</span>
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
                      ? i18n.t("pages.connectionDetails.table.status.issued")
                      : i18n.t("pages.connectionDetails.table.status.revoked")}
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
                    menuItems={[
                      {
                        label: i18n.t(
                          "pages.connectionDetails.table.menu.view"
                        ),
                        action: () => viewCredTemplate(row.data.schema.$id),
                        icon: <BadgeOutlined />,
                        className: "icon-left",
                      },
                      ...(roleViewIndex === RoleIndex.ISSUER
                        ? [
                            {
                              className: "divider",
                            },
                            {
                              label: i18n.t(
                                "pages.connectionDetails.table.menu.delete"
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
        />
      </Paper>
      <PopupModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        title={i18n.t("pages.connectionDetails.table.confirm.title")}
        description={i18n.t("pages.connectionDetails.table.confirm.body")}
        footer={
          <>
            <Button
              variant="contained"
              aria-label="cancel delete connection"
              onClick={() => setOpenModal(false)}
              className="neutral-button"
            >
              {i18n.t("pages.connectionDetails.table.confirm.cancel")}
            </Button>
            <Button
              variant="contained"
              aria-label="confirm delete connection"
              onClick={revokeCred}
              className="primary-button"
            >
              {i18n.t("pages.connectionDetails.table.confirm.confirm")}
            </Button>
          </>
        }
      />
    </Box>
  );
};

export { CredentialsTable };
