import { Box, Chip, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { PopupModal } from "../PopupModal";
import {
  PresentationDetailModalProps,
  CredentialStatus,
  SchemaInfo,
} from "./PresentationDetailModal.types";
import { SchemaService } from "../../services/schemas";
import { CredentialService } from "../../services/credential";
import CredentialBG from "../../assets/credential-bg.svg";
import "./PresentationDetailModal.scss";

const PresentationDetailModal = ({
  open,
  onClose,
  data,
}: PresentationDetailModalProps) => {
  const [credentialStatus, setCredentialStatus] =
    useState<CredentialStatus | null>(null);
  const [schemaInfo, setSchemaInfo] = useState<SchemaInfo | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && data) {
      fetchCredentialDetails();
    }
  }, [open, data]);

  const fetchCredentialDetails = async () => {
    if (!data) return;

    setLoading(true);
    try {
      // Use Promise.all for faster loading as suggested by iFergal
      const promises = [SchemaService.getSchema(data.schemaSaid)];

      // Add credential status fetch if presented
      if (data.status === "presented" && data.acdcCredential?.d) {
        promises.push(CredentialService.getCredential(data.acdcCredential.d));
      }

      const [schemaResponse, credentialResponse] = await Promise.all(promises);

      if (schemaResponse.status === 200) {
        setSchemaInfo({
          title: schemaResponse.data.title,
          description: schemaResponse.data.description,
          properties: schemaResponse.data.properties,
        });
      }

      if (data.status === "presented") {
        setCredentialStatus({
          status:
            credentialResponse.data.credential.status.s === "0"
              ? "issued"
              : "revoked",
          issuer: data.discloserIdentifier,
          holder: data.connectionName,
          issuanceDate: new Date(data.requestDate).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "long",
            year: "numeric",
          }),
          credentialSAD: data.acdcCredential || {},
        });
      }
    } catch (error) {
      console.error("Error fetching credential details:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderPresentedContent = () => {
    if (!data || !schemaInfo || !credentialStatus) return null;

    // Use acdcCredential.a for presented attributes as suggested by iFergal
    // Skip over .i, .dt, .u and ignore those, display the rest
    const credentialAttributes = data.acdcCredential?.a || {};
    const filteredAttributes = Object.keys(credentialAttributes).filter(
      (key) => !["i", "dt", "u", "d"].includes(key)
    );

    const credAttributes = filteredAttributes.map((key) => {
      const inputLabelText = key.replace(/([a-z])([A-Z])/g, "$1 $2");
      return {
        key: key,
        label: `${inputLabelText.at(0)?.toUpperCase()}${inputLabelText.slice(1)}`,
        value: credentialAttributes[key],
      };
    });

    return (
      <Box className="presentation-detail-modal">
        <Box sx={{ textAlign: "left", marginBottom: "1.5rem" }}>
          <Typography variant="subtitle1">Title</Typography>
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-start",
              gap: 1,
              marginBottom: "1.5rem",
            }}
          >
            <img
              width={36}
              src={CredentialBG}
              alt="schema-name"
            />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                className="content"
                variant="body2"
                sx={{ wordBreak: "break-word" }}
              >
                {schemaInfo.title}
              </Typography>
            </Box>
            {credentialStatus.status === "issued" && (
              <Chip
                label="Issued"
                className="status-badge issued"
                size="small"
                sx={{ flexShrink: 0 }}
              />
            )}
            {credentialStatus.status === "revoked" && (
              <Chip
                label="Revoked"
                className="status-badge revoked"
                size="small"
                sx={{ flexShrink: 0 }}
              />
            )}
          </Box>
        </Box>

        <Box sx={{ textAlign: "left", marginBottom: "1.5rem" }}>
          <Typography variant="subtitle1">Description</Typography>
          <Typography
            className="content"
            variant="body2"
          >
            {schemaInfo.description}
          </Typography>
        </Box>

        <Box sx={{ textAlign: "left", marginBottom: "1.5rem" }}>
          <Typography variant="subtitle1">Issuer</Typography>
          <Typography
            className="content"
            variant="body2"
          >
            {data.acdcCredential.i}
          </Typography>
        </Box>

        <Box sx={{ textAlign: "left", marginBottom: "1.5rem" }}>
          <Typography variant="subtitle1">Holder</Typography>
          <Typography
            className="content"
            variant="body2"
          >
            {data.connectionName}
          </Typography>
        </Box>

        <Box sx={{ textAlign: "left", marginBottom: "1.5rem" }}>
          <Typography variant="subtitle1">Date of Issuance</Typography>
          <Typography
            className="content"
            variant="body2"
          >
            {new Date(data.acdcCredential.a.dt).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </Typography>
        </Box>

        <Box sx={{ textAlign: "left" }}>
          <Typography variant="subtitle1">Attributes</Typography>
          <Box
            component="ul"
            sx={{ paddingLeft: "1.5rem", margin: 0 }}
          >
            {credAttributes.map((credAttribute) => (
              <Box
                component="li"
                key={credAttribute.key}
              >
                <Typography
                  className="content"
                  variant="body2"
                  component="span"
                >
                  <strong>{credAttribute.label}:</strong> {credAttribute.value}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    );
  };

  const renderRequestedContent = () => {
    if (!data || !schemaInfo) return null;

    const credAttributes = Object.keys(data.attributes).map((key) => {
      const inputLabelText = key.replace(/([a-z])([A-Z])/g, "$1 $2");
      return {
        key: key,
        label: `${inputLabelText.at(0)?.toUpperCase()}${inputLabelText.slice(1)}`,
        value: data.attributes[key],
      };
    });

    return (
      <Box className="presentation-detail-modal">
        <Box sx={{ textAlign: "left", marginBottom: "1.5rem" }}>
          <Typography variant="subtitle1">Title</Typography>
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-start",
              gap: 1,
              marginBottom: "1.5rem",
            }}
          >
            <img
              width={36}
              src={CredentialBG}
              alt="schema-name"
            />
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                className="content"
                variant="body2"
                sx={{ wordBreak: "break-word" }}
              >
                {schemaInfo.title}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box sx={{ textAlign: "left", marginBottom: "1.5rem" }}>
          <Typography variant="subtitle1">Being Requested From</Typography>
          <Typography
            className="content"
            variant="body2"
          >
            {data.connectionName}
          </Typography>
        </Box>

        <Box sx={{ textAlign: "left" }}>
          <Typography variant="subtitle1">Attributes</Typography>
          <Box
            component="ul"
            sx={{ paddingLeft: "1.5rem", margin: 0 }}
          >
            {credAttributes.map((credAttribute) => (
              <Box
                component="li"
                key={credAttribute.key}
              >
                <Typography
                  className="content"
                  variant="body2"
                  component="span"
                >
                  <strong>{credAttribute.label}:</strong> {credAttribute.value}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    );
  };

  const getModalTitle = () => {
    if (!data) return "";
    return data.status === "presented"
      ? "Presented Credential"
      : "Requested Presentation";
  };

  return (
    <PopupModal
      open={open}
      onClose={onClose}
      title={getModalTitle()}
      description=""
      customClass="presentation-detail-modal"
    >
      {loading ? (
        <div>Loading...</div>
      ) : data?.status === "presented" ? (
        renderPresentedContent()
      ) : (
        renderRequestedContent()
      )}
    </PopupModal>
  );
};

export { PresentationDetailModal };
