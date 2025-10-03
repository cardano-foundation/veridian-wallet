import { SwapHorizontalCircleOutlined } from "@mui/icons-material";
import {
  Box,
  Button,
  Paper,
  TableCell,
  TableRow,
  Tooltip,
} from "@mui/material";
import { useState } from "react";
import { AppTable, useTable } from "../../components/AppTable";
import { AppTableHeader } from "../../components/AppTable/AppTable.types";
import { filter, FilterBar } from "../../components/FilterBar";
import { FilterData } from "../../components/FilterBar/FilterBar.types";
import { PageHeader } from "../../components/PageHeader";
import { RequestPresentationModal } from "../../components/RequestPresentationModal";
import { PresentationDetailModal } from "../../components/PresentationDetailModal";
import { AttributeDisplay } from "./components/AttributeDisplay";
import { i18n } from "../../i18n";
import { useAppSelector } from "../../store/hooks";
import { PresentationRequestData } from "../../store/reducers/connectionsSlice.types";
import { usePresentationPolling } from "../../hooks/usePresentationPolling";
import { formatDate, formatDateTime } from "../../utils/dateFormatter";
import "./RequestPresentation.scss";

const headers: AppTableHeader<PresentationRequestData>[] = [
  {
    id: "connectionName",
    label: i18n.t("pages.requestPresentation.table.name"),
  },
  {
    id: "credentialType",
    label: i18n.t("pages.requestPresentation.table.credential"),
  },
  {
    id: "attributes",
    label: i18n.t("pages.requestPresentation.table.attribute"),
  },
  {
    id: "requestDate",
    label: i18n.t("pages.requestPresentation.table.requestDate"),
  },
  {
    id: "status",
    label: i18n.t("pages.requestPresentation.table.status.header"),
  },
];

export const RequestPresentation = () => {
  // const dispatch = useAppDispatch();
  const presentationRequests = useAppSelector(
    (state) => state.connections.presentationRequests
  );
  // const hasInitialized = useRef(false);
  const [openModal, setOpenModal] = useState(false);
  const [openDetailModal, setOpenDetailModal] = useState(false);
  const [selectedPresentation, setSelectedPresentation] =
    useState<PresentationRequestData | null>(null);

  const {
    order,
    orderBy,
    page,
    rowsPerPage,
    handleRequestSort,
    handleChangePage,
    handleChangeRowsPerPage,
    visibleRows,
  } = useTable(presentationRequests, "requestDate", "desc");

  // useEffect(() => {
  //   if (!hasInitialized.current) {
  //     hasInitialized.current = true;
  //     dispatch(fetchPresentationRequests());
  //   }
  // }, []);

  usePresentationPolling();

  const handleClick = () => {
    setOpenModal(true);
  };

  const handleRowClick = (row: PresentationRequestData) => {
    setSelectedPresentation(row);
    setOpenDetailModal(true);
  };

  const [filterData, setFilterData] = useState<FilterData>({
    startDate: null,
    endDate: null,
    keyword: "",
  });

  const visibleData = filter(visibleRows, filterData, { date: "requestDate" });

  return (
    <>
      <Box
        className="request-presentation-page"
        sx={{ padding: "0 2.5rem 2.5rem" }}
      >
        <PageHeader
          title={`${i18n.t("pages.requestPresentation.title", {
            number: presentationRequests.length,
          })}`}
          sx={{
            margin: "1.5rem 0",
          }}
          action={
            <Button
              className="add-connection-button primary-button"
              aria-haspopup="true"
              variant="contained"
              disableElevation
              disableRipple
              onClick={handleClick}
              startIcon={<SwapHorizontalCircleOutlined />}
            >
              {i18n.t("pages.requestPresentation.action")}
            </Button>
          }
        />
        <FilterBar
          onChange={setFilterData}
          totalFound={visibleData.length}
        />
        <Paper className="request-presentation-table">
          <AppTable
            order={order}
            rows={visibleData}
            onRenderRow={(row) => {
              return (
                <TableRow
                  hover
                  role="checkbox"
                  tabIndex={-1}
                  key={row.id}
                  className="table-row"
                  onClick={() => handleRowClick(row)}
                  sx={{ cursor: "pointer" }}
                >
                  <TableCell
                    component="th"
                    scope="row"
                  >
                    <Tooltip
                      title={row.connectionName}
                      placement="top"
                    >
                      <span>{row.connectionName}</span>
                    </Tooltip>
                  </TableCell>
                  <TableCell
                    component="th"
                    scope="row"
                  >
                    <Tooltip
                      title={row.credentialType}
                      placement="top"
                    >
                      <span>{row.credentialType}</span>
                    </Tooltip>
                  </TableCell>
                  <TableCell
                    align="left"
                    width={50}
                  >
                    <AttributeDisplay
                      data={row}
                      maxLength={25}
                    />
                  </TableCell>
                  <TableCell
                    component="th"
                    scope="row"
                  >
                    <Tooltip
                      title={formatDateTime(new Date(row.requestDate))}
                      placement="top"
                    >
                      <span>{formatDate(new Date(row.requestDate))}</span>
                    </Tooltip>
                  </TableCell>
                  <TableCell align="left">
                    <Box className={`label ${row.status}`}>
                      {row.status[0].toUpperCase() + row.status.slice(1)}
                    </Box>
                  </TableCell>
                  <TableCell />
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
      <RequestPresentationModal
        open={openModal}
        onClose={() => {
          setOpenModal(false);
        }}
      />
      <PresentationDetailModal
        open={openDetailModal}
        onClose={() => {
          setOpenDetailModal(false);
          setSelectedPresentation(null);
        }}
        data={selectedPresentation}
      />
    </>
  );
};
