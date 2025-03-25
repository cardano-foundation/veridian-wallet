import { MoreVert } from "@mui/icons-material";
import AddCircleOutlineOutlinedIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import {
  Box,
  IconButton,
  Paper,
  TableCell,
  TableRow,
  Tooltip,
} from "@mui/material";
import { useNavigate } from "react-router";
import { AppTable, useTable } from "../../components/AppTable";
import { AppTableHeader } from "../../components/AppTable/AppTable.types";
import { DropdownMenu } from "../../components/DropdownMenu";
import { RoleIndex } from "../../components/NavBar/constants/roles";
import { PageHeader } from "../../components/PageHeader";
import { CredentialMap, CredentialTypes } from "../../const";
import { RoutePath } from "../../const/route";
import { i18n } from "../../i18n";
import { useAppSelector } from "../../store/hooks";
import { getRoleView } from "../../store/reducers";
import { formatDate } from "../../utils/dateFormatter";
import { CredentialTemplateRow } from "./Credential.types";

const headers: AppTableHeader<CredentialTemplateRow>[] = [
  {
    id: "name",
    label: i18n.t("pages.credentials.table.template"),
  },
  {
    id: "date",
    label: i18n.t("pages.credentials.table.creationDate"),
  },
];

export const Credentials = () => {
  const roleViewIndex = useAppSelector(getRoleView) as RoleIndex;
  const tableRows: CredentialTemplateRow[] = CredentialTypes.map((row) => ({
    id: `${Object.entries(CredentialMap).find(([_, value]) => value === row)?.[0]}`,
    name: row,
    date: new Date().getTime(),
  }));
  const nav = useNavigate();

  const {
    order,
    orderBy,
    page,
    rowsPerPage,
    handleRequestSort,
    handleChangePage,
    handleChangeRowsPerPage,
    visibleRows,
  } = useTable(tableRows, "name");

  const viewCredTemplate = (id: string) => {
    nav(`${RoutePath.Credentials}/${id}`);
  };

  const issueCred = () => {};

  return (
    <Box
      className="credentials-page"
      sx={{ padding: "0 2.5rem 2.5rem" }}
    >
      <PageHeader
        title={`${i18n.t("pages.credentials.title", {
          number: CredentialTypes.length,
        })}`}
        sx={{
          margin: "1.5rem 0",
        }}
      />
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
          onRenderRow={(row) => {
            return (
              <TableRow
                hover
                role="checkbox"
                tabIndex={-1}
                key={row.id}
                className="table-row"
              >
                <TableCell
                  component="th"
                  scope="row"
                >
                  {row.name}
                </TableCell>
                <TableCell
                  component="th"
                  scope="row"
                >
                  {formatDate(new Date(row.date))}
                </TableCell>
                <TableCell
                  width={50}
                  align="left"
                >
                  <DropdownMenu
                    button={
                      <Tooltip
                        title={i18n.t("pages.credentials.actions")}
                        placement="top"
                      >
                        <IconButton aria-label="actions">
                          <MoreVert />
                        </IconButton>
                      </Tooltip>
                    }
                    menuItems={[
                      {
                        label: i18n.t("pages.credentials.table.menu.view"),
                        action: () => viewCredTemplate(row.id),
                        icon: <VisibilityOutlinedIcon />,
                        className: "icon-left",
                      },
                      ...(roleViewIndex === RoleIndex.ISSUER
                        ? [
                            {
                              className: "divider",
                            },
                            {
                              label: i18n.t(
                                "pages.credentials.table.menu.issue"
                              ),
                              action: () => issueCred(),
                              icon: <AddCircleOutlineOutlinedIcon />,
                              className: "icon-left",
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
            count: CredentialTypes.length,
            rowsPerPage: rowsPerPage,
            page: page,
            onPageChange: handleChangePage,
            onRowsPerPageChange: handleChangeRowsPerPage,
          }}
        />
      </Paper>
    </Box>
  );
};
