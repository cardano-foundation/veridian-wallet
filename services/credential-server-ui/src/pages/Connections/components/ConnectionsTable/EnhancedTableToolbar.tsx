import * as React from "react";
import { Toolbar, Typography, IconButton, Button } from "@mui/material";
import { DeleteOutline, FilterList } from "@mui/icons-material";
import { i18n } from "../../../../i18n";
import { useState } from "react";
import { PopupModal } from "../../../../components/PopupModal";
import { handleDeleteContact } from "./helpers";
import { AppDispatch } from "../../../../store";
import { useDispatch } from "react-redux";
import { enqueueSnackbar, VariantType } from "notistack";

interface EnhancedTableToolbarProps {
  selected: string[];
  setSelected: (selected: string[]) => void;
}

const EnhancedTableToolbar: React.FC<EnhancedTableToolbarProps> = (props) => {
  const { selected, setSelected } = props;
  const dispatch = useDispatch<AppDispatch>();
  const [openModal, setOpenModal] = useState(false);
  const numSelected = selected.length;

  const handleDelete = async () => {
    for (const id of selected) {
      await handleDeleteContact(id, dispatch, triggerToast);
    }
    setSelected([]);
    setOpenModal(false);
  };

  const triggerToast = (message: string, variant: VariantType) => {
    enqueueSnackbar(message, {
      variant,
      anchorOrigin: { vertical: "top", horizontal: "center" },
    });
  };

  return (
    <>
      <Toolbar
        className={`connection-table-toolbar${
          numSelected == 0 ? " hidden" : ""
        }`}
      >
        <div className="table-left">
          <IconButton>
            <FilterList />
            <Typography
              color="inherit"
              variant="subtitle1"
              component="div"
            >
              {i18n.t("pages.connections.filter")}
            </Typography>
          </IconButton>
        </div>
        <div className="table-right">
          {numSelected > 0 && (
            <>
              <Typography
                color="inherit"
                variant="subtitle1"
                component="div"
              >
                {numSelected} {i18n.t("pages.connections.selected")}
              </Typography>
              <Button
                variant="contained"
                aria-label="delete connections"
                startIcon={<DeleteOutline />}
                className="delete-connections-button delete-button"
                onClick={() => setOpenModal(true)}
              >
                {i18n.t("pages.connections.delete")}
              </Button>
            </>
          )}
        </div>
      </Toolbar>
      <PopupModal
        open={openModal}
        onClose={() => setOpenModal(false)}
        title={i18n.t("pages.connections.deleteConnections.title")}
        description={i18n.t("pages.connections.deleteConnections.body")}
        footer={
          <>
            <Button
              variant="contained"
              className="neutral-button"
              onClick={() => setOpenModal(false)}
            >
              {i18n.t("pages.connections.deleteConnections.cancel")}
            </Button>
            <Button
              variant="contained"
              className="primary-button"
              onClick={handleDelete}
            >
              {i18n.t("pages.connections.deleteConnections.delete")}
            </Button>
          </>
        }
      />
    </>
  );
};

export { EnhancedTableToolbar };
