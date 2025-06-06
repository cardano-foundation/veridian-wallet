import { Box, Typography } from "@mui/material";
import CredentialBG from "../../assets/credential-bg.svg";
import { i18n } from "../../i18n";
import { ReviewProps } from "./IssueCredentialModal.types";

const Review = ({
  credentialType,
  connectionId,
  connections,
  attribute,
}: ReviewProps) => {
  if (!credentialType || !connectionId) return null;

  const credAttributes = Object.keys(attribute).map((key) => {
    const inputLabelText = key.replace(/([a-z])([A-Z])/g, "$1 $2");

    return {
      key: key,
      label: `${inputLabelText.at(0)?.toUpperCase()}${inputLabelText.slice(1)}`,
    };
  });
  const connectionName = connections.find(
    (item) => item.id === connectionId
  )?.alias;

  return (
    <Box className="review-stage">
      <Box sx={{ textAlign: "left" }}>
        <Typography variant="subtitle1">
          {i18n.t("pages.credentialDetails.issueCredential.review.credential")}
        </Typography>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <img
            width={36}
            src={CredentialBG}
            alt="schema-name"
          />
          <Typography
            className="content"
            variant="body2"
          >
            {credentialType}
          </Typography>
        </Box>
      </Box>
      <Box sx={{ textAlign: "left" }}>
        <Typography variant="subtitle1">
          {i18n.t("pages.credentialDetails.issueCredential.review.issueTo")}
        </Typography>
        <Typography
          className="content"
          variant="body2"
        >
          {connectionName}
        </Typography>
      </Box>
      {credAttributes.map((credAttribute) => (
        <Box
          key={credAttribute.key}
          sx={{ textAlign: "left" }}
        >
          <Typography variant="subtitle1">{credAttribute.label}</Typography>
          <Typography
            className="content"
            variant="body2"
          >
            {attribute[credAttribute.key]}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

export { Review };
