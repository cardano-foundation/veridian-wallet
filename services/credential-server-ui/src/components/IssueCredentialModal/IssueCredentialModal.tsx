import ArrowBackOutlinedIcon from "@mui/icons-material/ArrowBackOutlined";
import { Alert, Box, Button, CircularProgress } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { Trans } from "react-i18next";
import { IGNORE_ATTRIBUTES } from "../../const";
import { useSchemaDetail } from "../../hooks/SchemaDetail";
import { i18n } from "../../i18n";
import { CredentialService } from "../../services";
import { keriAuthService } from "../../services/keriAuthService";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { fetchContactCredentials } from "../../store/reducers/connectionsSlice";
import { triggerToast } from "../../utils/toast";
import { PopupModal } from "../PopupModal";
import { useKERIAuth } from "../AuthContext";
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

const IssueCredentialModal = ({
  open,
  onClose,
  credentialTypeId,
  connectionId,
}: IssueCredentialModalProps) => {
  const RESET_TIMEOUT = 1000;
  const connections = useAppSelector((state) => state.connections.contacts);
  const schemas = useAppSelector((state) => state.schemasCache.schemas);
  const dispatch = useAppDispatch();
  const { isExtensionInstalled, isAuthorized, authorize, loading: authLoading, error: authError } = useKERIAuth();
  const [currentStage, setCurrentStage] = useState(
    calcInitStage(credentialTypeId, connectionId)
  );
  const [selectedConnection, setSelectedConnection] = useState(connectionId);
  const [selectedCredTemplate, setSelectedCredTemplate] =
    useState(credentialTypeId);
  const [attributes, setAttributes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('Loading...');
  const schema = useSchemaDetail(selectedCredTemplate);
  const properties = schema?.properties?.a?.oneOf?.[1]?.properties || {};
  const requiredList = schema?.properties?.a?.oneOf?.[1]?.required || [];
  const attributeKeys = Object.keys(properties).filter(
    (key) => !IGNORE_ATTRIBUTES.includes(key)
  );
  const renderedRequiredList = requiredList.filter((key) =>
    attributeKeys.includes(key)
  );
  const allRequiredAttributesFilled =
    currentStage !== IssueCredentialStage.InputAttribute
      ? true
      : renderedRequiredList.every(
          (key) =>
            attributes[key] !== undefined && attributes[key].trim() !== ""
        );

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
        return isExtensionInstalled 
          ? "Sign & Issue" 
          : "pages.credentialDetails.issueCredential.review.button.issue";
      case IssueCredentialStage.SelectConnection:
      default:
        return "pages.credentialDetails.issueCredential.selectConnection.button.continue";
    }
  }, [currentStage, isExtensionInstalled]);

  const disablePrimaryButton = useMemo(() => {
    return (
      (currentStage === IssueCredentialStage.SelectCredentialType &&
        !selectedCredTemplate) ||
      (currentStage === IssueCredentialStage.SelectConnection &&
        !selectedConnection) ||
      (currentStage === IssueCredentialStage.InputAttribute &&
        !allRequiredAttributesFilled) ||
      loading ||
      authLoading
    );
  }, [
    currentStage,
    selectedCredTemplate,
    selectedConnection,
    loading,
    authLoading,
    allRequiredAttributesFilled,
  ]);

  const issueCred = async () => {
    if (!selectedCredTemplate || !selectedConnection) {
      console.error('[IssueCredential] Missing required fields:', { 
        selectedCredTemplate, 
        selectedConnection 
      });
      return;
    }

    try {
      setLoading(true);
      setLoadingMessage('Preparing...');
      console.log('[IssueCredential] Starting credential issuance flow...');

      // If KERIAuth extension is installed and user not authorized, request authorization
      if (isExtensionInstalled && !isAuthorized) {
        console.log('[IssueCredential] Requesting authorization...');
        setLoadingMessage('Authorizing...');
        try {
          await authorize('Do you approve issuance of this credential?');
          console.log('[IssueCredential] Authorization successful');
        } catch (authError: any) {
          // User rejected authorization
          console.error('[IssueCredential] Authorization rejected:', authError);
          triggerToast(
            authError.message || 'Authorization rejected. Credential not issued.',
            "error"
          );
          return;
        }
      }

      // Prepare credential attributes
      const schemaSaid = selectedCredTemplate;
      const attribute = Object.fromEntries(
        Object.entries(attributes).filter(
          ([_, v]) =>
            v !== undefined &&
            v !== null &&
            !(typeof v === "string" && v.trim() === "")
        )
      );

      console.log('[IssueCredential] Credential data prepared:', {
        schemaSaid,
        aid: selectedConnection,
        attributes: attribute,
      });

      // If extension is installed and authorized, sign the credential first
      if (isExtensionInstalled && isAuthorized) {
        console.log('[IssueCredential] Signing credential with KERIAuth extension...');
        setLoadingMessage('Signing in wallet...');
        
        try {
          // Create credential data for signing
          const credData = {
            i: selectedConnection, // holder AID
            ...attribute,
          };

          console.log('[IssueCredential] Sending to extension for preview and signing:', {
            credData,
            schemaSaid,
          });

          // This will open the extension UI for preview and signing
          const signedCredential = await keriAuthService.createDataAttestationCredential({
            credData,
            schemaSaid,
          });

          console.log('[IssueCredential] Credential signed successfully:', signedCredential);

          // TODO: Send signed credential to backend
          // For now, we'll continue with the original flow
          // In the future, modify the backend to accept signed credentials
          
          triggerToast(
            'Credential signed successfully! Now issuing...',
            "success"
          );
        } catch (signError: any) {
          console.error('[IssueCredential] Signing failed:', signError);
          triggerToast(
            `Signing failed: ${signError.message || 'Unknown error'}`,
            "error"
          );
          return;
        }
      }

      // Issue credential (with or without signature)
      setLoadingMessage('Issuing credential...');
      let objAttributes = {};
      if (Object.keys(attribute).length) {
        objAttributes = {
          attribute,
        };
      }

      const issueData = {
        schemaSaid: schemaSaid,
        aid: selectedConnection,
        ...objAttributes,
      };

      console.log('[IssueCredential] Issuing credential to backend:', issueData);
      
      await CredentialService.issue(issueData);
      
      console.log('[IssueCredential] Credential issued successfully');
      
      triggerToast(
        i18n.t("pages.credentialDetails.issueCredential.messages.success"),
        "success"
      );
      dispatch(fetchContactCredentials(selectedConnection));
      resetModal();
    } catch (e: any) {
      console.error('[IssueCredential] Error during issuance:', e);
      triggerToast(
        e.message || i18n.t("pages.credentialDetails.issueCredential.messages.error"),
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
              if (currentStage !== IssueCredentialStage.Review) {
                setAttributes({});
              }
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
          disabled={disablePrimaryButton || authLoading}
          onClick={() => {
            const nextStage = getNextStage(currentStage);
            if (nextStage) {
              setCurrentStage(nextStage);
              return;
            }

            issueCred();
          }}
        >
          {(loading || authLoading) ? (
            <>
              <CircularProgress size={20} style={{ marginRight: 8 }} />
              {authLoading ? 'Authorizing...' : loadingMessage}
            </>
          ) : (
            primaryButton.includes('.') ? i18n.t(primaryButton) : primaryButton
          )}
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
          subText: `${connection.id.substring(0, 4)}...${connection.id.slice(
            -4
          )}`,
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
          id: schema.id,
          text: schema.name,
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
        return attributeKeys.map((attribute) => (
          <InputAttribute
            key={attribute}
            value={attributes}
            setValue={updateAttributes}
            attributes={[attribute]}
            required={requiredList.includes(attribute)}
            properties={properties}
          />
        ));
      }
      case IssueCredentialStage.Review: {
        const nonEmptyAttributes = Object.fromEntries(
          Object.entries(attributes).filter(
            ([_, v]) => v !== undefined && v !== null && String(v).trim() !== ""
          )
        );
        return (
          <Review
            credentialType={schema?.title}
            attribute={nonEmptyAttributes}
            connectionId={selectedConnection}
            connections={connections}
          />
        );
      }
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
      {/* Show authorization error if any */}
      {authError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {authError}
        </Alert>
      )}

      {renderStage(currentStage)}
    </PopupModal>
  );
};

export { IssueCredentialModal };
