import AddCircleOutlineOutlinedIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import { Box, Button } from "@mui/material";
import { useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { IssueCredentialModal } from "../../components/IssueCredentialModal";
import { RoleIndex } from "../../components/NavBar/constants/roles";
import { PageHeader } from "../../components/PageHeader";
import { i18n } from "../../i18n";
import { useAppSelector } from "../../store/hooks";
import { getRoleView } from "../../store/reducers";
import "./CredentialDetails.scss";
import { CredentialInfoCard } from "./CredentialInfoCard";
import { CredentialTable } from "./CredentialsTable";

export const CredentialDetails = () => {
  const [open, setOpen] = useState(false);
  const roleViewIndex = useAppSelector(getRoleView) as RoleIndex;
  const credentials = useAppSelector((state) => state.connections.credentials);
  const schemas = useAppSelector((state) => state.schemasCache.schemas);
  const nav = useNavigate();
  const { id } = useParams();

  const schemaName = schemas.find((item) => item.id === id)?.name || "";

  const displayCredentials = useMemo(
    () => credentials.filter((item) => item.schema.$id === id),
    [credentials, id]
  );

  return (
    <>
      <Box className="credential-detail-page">
        <PageHeader
          onBack={() => nav(-1)}
          title={`${i18n.t("pages.credentialDetails.title")}`}
          action={
            roleViewIndex === 0 && (
              <Button
                variant="contained"
                disableElevation
                disableRipple
                startIcon={<AddCircleOutlineOutlinedIcon />}
                onClick={() => setOpen(true)}
              >
                {i18n.t("pages.credentialDetails.issue")}
              </Button>
            )
          }
        />
        <Box className="credential-detail-page-container">
          <CredentialInfoCard
            schemaName={schemaName}
            creationDate={new Date()}
          />
          <CredentialTable credentials={displayCredentials} />
        </Box>
      </Box>
      <IssueCredentialModal
        open={open}
        onClose={() => setOpen(false)}
        credentialTypeId={id}
      />
    </>
  );
};
