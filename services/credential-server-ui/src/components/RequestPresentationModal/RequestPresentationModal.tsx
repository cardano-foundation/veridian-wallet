import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import { Box, Button } from "@mui/material";
import { enqueueSnackbar, VariantType } from "notistack";
import { useEffect, useMemo, useState } from "react";
import { Trans } from "react-i18next";
import { IGNORE_ATTRIBUTES } from "../../const";
import { useSchemaDetail } from "../../hooks/SchemaDetail";
import { i18n } from "../../i18n";
import { CredentialService } from "../../services";
import { CredentialIssueRequest } from "../../services/credential.types";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { savePresentationRequest } from "../../store/reducers/connectionsSlice";
import { PresentationRequestStatus } from "../../store/reducers/connectionsSlice.types";
import { PopupModal } from "../PopupModal";
import { InputAttribute } from "./InputAttribute";
import "./RequestPresentationModal.scss";
import {
  RequestPresentationModalProps,
  RequestPresentationStage,
  SelectListData,
} from "./RequestPresentationModal.types";
import { Review } from "./Review";
import { SelectList } from "./SelectList";

const RESET_TIMEOUT = 1000;

const RequestPresentationModal = ({
  open,
  onClose,
  connectionId,
}: RequestPresentationModalProps) => {
  const connections = useAppSelector((state) => state.connections.contacts);
  const schemas = useAppSelector((state) => state.schemasCache.schemas);
  const dispatch = useAppDispatch();

  const [currentStage, setCurrentStage] = useState(
    RequestPresentationStage.SelectConnection
  );
  const [selectedConnection, setSelectedConnection] = useState<
    string | undefined
  >(connectionId);
  const [selectedCredTemplate, setSelectedCredTemplate] = useState<string>();
  const [attributes, setAttributes] = useState<Record<string, string>>({});

  const schema = useSchemaDetail(selectedCredTemplate);

  const credTemplateType = selectedCredTemplate ? schema?.title : undefined;

  const triggerToast = (message: string, variant: VariantType) => {
    enqueueSnackbar(message, {
      variant,
      anchorOrigin: { vertical: "top", horizontal: "center" },
    });
  };
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!connectionId) return;

    setCurrentStage(RequestPresentationStage.SelectCredentialType);
    setSelectedConnection(connectionId);
  }, [connectionId]);

  const resetModal = () => {
    onClose();
    setSelectedConnection(undefined);
    setSelectedCredTemplate(undefined);
    setAttributes({});
    setTimeout(() => {
      setCurrentStage(RequestPresentationStage.SelectConnection);
    }, RESET_TIMEOUT);
  };

  const description = useMemo(() => {
    switch (currentStage) {
      case RequestPresentationStage.InputAttribute:
        return "pages.requestPresentation.modal.inputAttribute.description";
      case RequestPresentationStage.Review:
        return "pages.requestPresentation.modal.review.description";
      case RequestPresentationStage.SelectCredentialType:
        return "pages.requestPresentation.modal.selectCredential.description";
      case RequestPresentationStage.SelectConnection:
      default:
        return "pages.requestPresentation.modal.selectConnection.description";
    }
  }, [currentStage]);

  const primaryButton = useMemo(() => {
    switch (currentStage) {
      case RequestPresentationStage.InputAttribute:
        return "pages.requestPresentation.modal.inputAttribute.button.continue";
      case RequestPresentationStage.Review:
        return "pages.requestPresentation.modal.review.button.issue";
      case RequestPresentationStage.SelectConnection:
      default:
        return "pages.requestPresentation.modal.selectConnection.button.continue";
    }
  }, [currentStage]);

  const disablePrimaryButton = useMemo(() => {
    return (
      (currentStage === RequestPresentationStage.SelectCredentialType &&
        !selectedCredTemplate) ||
      (currentStage === RequestPresentationStage.SelectConnection &&
        !selectedConnection) ||
      loading
    );
  }, [currentStage, selectedCredTemplate, selectedConnection, loading]);

  const requestPresentationCred = async () => {
    if (!selectedCredTemplate || !selectedConnection || !credTemplateType)
      return;

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

    const data: CredentialIssueRequest = {
      schemaSaid: selectedCredTemplate,
      aid: selectedConnection,
      ...objAttributes,
    };

    try {
      setLoading(true);
      await CredentialService.requestPresentation(data);
      triggerToast(
        i18n.t("pages.requestPresentation.modal.messages.success"),
        "success"
      );

      dispatch(
        savePresentationRequest({
          id: String(Date.now),
          connectionName:
            connections.find((item) => item.id === selectedConnection)?.alias ||
            "",
          credentialType: credTemplateType,
          attribute: Object.values(attributes)[0],
          requestDate: Date.now(),
          status: PresentationRequestStatus.Requested,
        })
      );
      resetModal();
    } catch (e) {
      triggerToast(
        i18n.t("pages.requestPresentation.modal.messages.error"),
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
          !connectionId ? RequestPresentationStage.SelectCredentialType : null,
          RequestPresentationStage.InputAttribute,
          RequestPresentationStage.Review,
        ].includes(currentStage) && (
          <Button
            variant="contained"
            className="neutral-button"
            startIcon={<ArrowBackOutlinedIcon />}
            onClick={() => {
              setCurrentStage(currentStage - 1);
            }}
          >
            {i18n.t("pages.requestPresentation.modal.back")}
          </Button>
        )}
        <Button
          variant="contained"
          className="primary-button"
          disabled={disablePrimaryButton}
          onClick={() => {
            const nextStage = currentStage + 1;
            if (nextStage <= RequestPresentationStage.Review) {
              setCurrentStage(nextStage);
              return;
            }

            requestPresentationCred();
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

  const renderStage = (currentStage: RequestPresentationStage) => {
    switch (currentStage) {
      case RequestPresentationStage.SelectConnection: {
        const data: SelectListData[] = connections.map((connection) => ({
          id: connection.id,
          text: connection.alias,
          subText: `${connection.id.substring(0, 4)}...${connection.id.slice(-4)}`,
        }));

        return (
          <SelectList
            onChange={setSelectedConnection}
            data={data}
            value={selectedConnection}
          />
        );
      }
      case RequestPresentationStage.SelectCredentialType: {
        const data: SelectListData[] = schemas.map((schema) => ({
          id: schema.id,
          text: schema.name,
        }));

        return (
          <SelectList
            onChange={setSelectedCredTemplate}
            data={data}
            value={selectedCredTemplate}
          />
        );
      }
      case RequestPresentationStage.InputAttribute: {
        const schemaRequiredAttributes =
          schema?.properties.a.oneOf[1].required || [];

        const requiredAttributes = schemaRequiredAttributes.filter(
          (item) => !IGNORE_ATTRIBUTES.includes(item)
        );

        return (
          <InputAttribute
            attributeOptional={true}
            value={attributes}
            setValue={updateAttributes}
            attributes={requiredAttributes}
          />
        );
      }
      case RequestPresentationStage.Review:
        return (
          <Review
            credentialType={credTemplateType}
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
      title={i18n.t("pages.requestPresentation.modal.title")}
      customClass={`request-presentation-modal stage-${currentStage}`}
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

export { RequestPresentationModal };
