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
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { AppTable, useTable } from "../../components/AppTable";
import { AppTableHeader } from "../../components/AppTable/AppTable.types";
import { DropdownMenu } from "../../components/DropdownMenu";
import { filter, FilterBar } from "../../components/FilterBar";
import { FilterData } from "../../components/FilterBar/FilterBar.types";
import { IssueCredentialModal } from "../../components/IssueCredentialModal";
import { RoleIndex } from "../../components/NavBar/constants/roles";
import { PageHeader } from "../../components/PageHeader";
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
  const schemaCaches = useAppSelector((state) => state.schemasCache.schemas);
  const tableRows: CredentialTemplateRow[] = schemaCaches.map((row) => ({
    id: row.id,
    name: row.name,
    date: new Date().getTime(),
  }));
  const nav = useNavigate();

  const [open, setOpen] = useState(false);
  const [selectedCredType, setSelectedCredType] = useState<string>();

  useEffect(() => {
    if (roleViewIndex !== RoleIndex.ISSUER) nav(RoutePath.Connections);
  }, [nav, roleViewIndex]);

  const [filterData, setFilterData] = useState<FilterData>({
    startDate: null,
    endDate: null,
    keyword: "",
  });

  const visibleData = filter(tableRows, filterData, { date: "date" });

  const {
    order,
    orderBy,
    page,
    rowsPerPage,
    handleRequestSort,
    handleChangePage,
    handleChangeRowsPerPage,
    visibleRows,
  } = useTable(tableRows, "date");

  const viewCredTemplate = (id: string) => {
    nav(`${RoutePath.Credentials}/${id}`);
  };

  return (
    <>
      <Box
        className="credentials-page"
        sx={{ padding: "0 2.5rem 2.5rem" }}
      >
        <PageHeader
          title={`${i18n.t("pages.credentials.title", {
            number: schemaCaches.length,
          })}`}
          sx={{
            margin: "1.5rem 0",
          }}
        />
        <FilterBar
          onChange={setFilterData}
          totalFound={visibleData.length}
        />
        <Paper
          sx={{
            borderRadius: "1rem",
            overflow: "hidden",
            boxShadow:
              "0.25rem 0.25rem 1.25rem 0 rgba(var(--text-color-rgb), 0.16)",
            flex: 1,
          }}
          className="credentials-table"
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
                                icon: <AddCircleOutlineOutlinedIcon />,
                                className: "icon-left",
                                action: () => {
                                  setOpen(true);
                                  setSelectedCredType(row.id);
                                },
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
              count: visibleData.length,
              rowsPerPage: rowsPerPage,
              page: page,
              onPageChange: handleChangePage,
              onRowsPerPageChange: handleChangeRowsPerPage,
            }}
          />
        </Paper>
      </Box>
      <IssueCredentialModal
        open={open}
        onClose={() => {
          setOpen(false);
          setSelectedCredType(undefined);
        }}
        credentialTypeId={selectedCredType}
      />
    </>
  );
};
