import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import { Box, Button } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { Trans } from "react-i18next";
import { i18n } from "../../i18n";
import { CredentialService } from "../../services";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { fetchContactCredentials } from "../../store/reducers/connectionsSlice";
import { triggerToast } from "../../utils/toast";
import { PopupModal } from "../PopupModal";
import { calcInitStage, getBackStage, getNextStage } from "./helper";
import { InputAttribute } from "./InputAttribute";
import "./IssueCredentialModal.scss";
import {
  IssueCredentialModalProps,
  IssueCredentialStage,
  IssueCredListData,
} from "./IssueCredentialModal.types";
import { IssueCredListTemplate } from "./IssueCredListTemplate";
import { Review } from "./Review";
import { IGNORE_ATTRIBUTES } from "../../const";

const RESET_TIMEOUT = 1000;

const IssueCredentialModal = ({
  open,
  onClose,
  credentialTypeId,
  connectionId,
}: IssueCredentialModalProps) => {
  const connections = useAppSelector((state) => state.connections.contacts);
  const schemas = useAppSelector((state) => state.schemasCache.schemas);
  const dispatch = useAppDispatch();
  const [currentStage, setCurrentStage] = useState(
    calcInitStage(credentialTypeId, connectionId)
  );
  const [selectedConnection, setSelectedConnection] = useState(connectionId);
  const [selectedCredTemplate, setSelectedCredTemplate] =
    useState(credentialTypeId);
  const [attributes, setAttributes] = useState<Record<string, string>>({});

  const [loading, setLoading] = useState(false);

  const credTemplateName = selectedCredTemplate
    ? schemas.find((item) => item.$id === selectedCredTemplate)?.title
    : undefined;

  useEffect(() => {
    if (!open) return;
    const stage = calcInitStage(credentialTypeId, connectionId);
    setCurrentStage(stage);
    if (connectionId) setSelectedConnection(connectionId);
    if (credentialTypeId) setSelectedCredTemplate(credentialTypeId);
  }, [connectionId, credentialTypeId, open]);

  const resetModal = () => {
    onClose();
    setSelectedConnection(undefined);
    setSelectedCredTemplate(undefined);
    setAttributes({});
    setTimeout(() => {
      setCurrentStage(calcInitStage(credentialTypeId, connectionId));
    }, RESET_TIMEOUT);
  };

  const description = useMemo(() => {
    switch (currentStage) {
      case IssueCredentialStage.InputAttribute:
        return "pages.credentialDetails.issueCredential.inputAttribute.description";
      case IssueCredentialStage.Review:
        return "pages.credentialDetails.issueCredential.review.description";
      case IssueCredentialStage.SelectCredentialType:
        return "pages.credentialDetails.issueCredential.selectCredential.description";
      case IssueCredentialStage.SelectConnection:
      default:
        return "pages.credentialDetails.issueCredential.selectConnection.description";
    }
  }, [currentStage]);

  const primaryButton = useMemo(() => {
    switch (currentStage) {
      case IssueCredentialStage.InputAttribute:
        return "pages.credentialDetails.issueCredential.inputAttribute.button.continue";
      case IssueCredentialStage.Review:
        return "pages.credentialDetails.issueCredential.review.button.issue";
      case IssueCredentialStage.SelectConnection:
      default:
        return "pages.credentialDetails.issueCredential.selectConnection.button.continue";
    }
  }, [currentStage]);

  const disablePrimaryButton = useMemo(() => {
    return (
      (currentStage === IssueCredentialStage.SelectCredentialType &&
        !selectedCredTemplate) ||
      (currentStage === IssueCredentialStage.SelectConnection &&
        !selectedConnection) ||
      (currentStage === IssueCredentialStage.InputAttribute &&
        Object.values(attributes).every((item) => !item)) ||
      loading
    );
  }, [
    currentStage,
    selectedCredTemplate,
    selectedConnection,
    attributes,
    loading,
  ]);

  const issueCred = async () => {
    if (!selectedCredTemplate || !selectedConnection) {
      return;
    }

    const schemaSaid = selectedCredTemplate;
    let objAttributes = {};
    const attribute: Record<string, string> = {};

    Object.entries(attributes).forEach(([key, value]) => {
      if (key && value) attribute[key] = value;
    });

    if (Object.keys(attribute).length) {
      objAttributes = {
        attribute,
      };
    }

    const data = {
      schemaSaid: schemaSaid,
      aid: selectedConnection,
      ...objAttributes,
    };

    try {
      setLoading(true);
      await CredentialService.issue(data);
      triggerToast(
        i18n.t("pages.credentialDetails.issueCredential.messages.success"),
        "success"
      );
      dispatch(fetchContactCredentials(selectedConnection));
      resetModal();
    } catch (e) {
      triggerToast(
        i18n.t("pages.credentialDetails.issueCredential.messages.success"),
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const renderButton = () => {
    return (
      <Box className="footer">
        {[
          IssueCredentialStage.InputAttribute,
          IssueCredentialStage.Review,
        ].includes(currentStage) && (
          <Button
            variant="contained"
            className="neutral-button"
            startIcon={<ArrowBackOutlinedIcon />}
            onClick={() => {
              setCurrentStage(
                getBackStage(currentStage, !credentialTypeId) ||
                  IssueCredentialStage.SelectConnection
              );
            }}
          >
            {i18n.t("pages.credentialDetails.issueCredential.back")}
          </Button>
        )}
        <Button
          variant="contained"
          className="primary-button"
          disabled={disablePrimaryButton}
          onClick={() => {
            const nextStage = getNextStage(currentStage);
            if (nextStage) {
              setCurrentStage(nextStage);
              return;
            }

            issueCred();
          }}
        >
          {i18n.t(primaryButton)}
        </Button>
      </Box>
    );
  };

  const updateAttributes = (key: string, value: string) => {
    setAttributes((currentValue) => ({
      ...currentValue,
      [key]: value,
    }));
  };

  const renderStage = (currentStage: IssueCredentialStage) => {
    switch (currentStage) {
      case IssueCredentialStage.SelectConnection: {
        const data: IssueCredListData[] = connections.map((connection) => ({
          id: connection.id,
          text: connection.alias,
          subText: `${connection.id.substring(0, 4)}...${connection.id.slice(-4)}`,
        }));

        return (
          <IssueCredListTemplate
            onChange={setSelectedConnection}
            data={data}
            value={selectedConnection}
          />
        );
      }
      case IssueCredentialStage.SelectCredentialType: {
        const data: IssueCredListData[] = schemas.map((schema) => ({
          id: schema.$id,
          text: schema.title,
        }));

        return (
          <IssueCredListTemplate
            onChange={setSelectedCredTemplate}
            data={data}
            value={selectedCredTemplate}
          />
        );
      }
      case IssueCredentialStage.InputAttribute: {
        const schema = schemas.find(
          (item) => item.$id === selectedCredTemplate
        );
        const schemaRequiredAttributes =
          schema?.properties.a.oneOf[1].required || [];

        const requiredAttributes = schemaRequiredAttributes.filter(
          (item) => !IGNORE_ATTRIBUTES.includes(item)
        );

        return (
          <InputAttribute
            value={attributes}
            setValue={updateAttributes}
            attributes={requiredAttributes}
          />
        );
      }
      case IssueCredentialStage.Review:
        return (
          <Review
            credentialType={credTemplateName}
            attribute={attributes}
            connectionId={selectedConnection}
            connections={connections}
          />
        );
      default:
        return null;
    }
  };

  return (
    <PopupModal
      open={open}
      onClose={resetModal}
      title={i18n.t("pages.credentialDetails.issueCredential.title")}
      customClass={`issue-cred-modal stage-${currentStage}`}
      description={
        <Trans
          i18nKey={description}
          components={{ bold: <strong /> }}
        />
      }
      footer={renderButton()}
    >
      {renderStage(currentStage)}
    </PopupModal>
  );
};

export { IssueCredentialModal };
