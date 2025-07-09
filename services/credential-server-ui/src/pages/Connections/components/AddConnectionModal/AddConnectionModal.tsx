import {
  ArrowBack,
  CheckCircleOutlined,
  ContentCopy,
  ExpandMore,
  MoreVert,
  PhotoCamera,
  QrCodeRounded,
  RefreshOutlined,
  WarningAmber,
} from "@mui/icons-material";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  CircularProgress,
  Typography,
} from "@mui/material";
import axios from "axios";
import { Html5QrcodeScanner } from "html5-qrcode";
import { useSnackbar, VariantType } from "notistack";
import { QRCodeSVG } from "qrcode.react";
import React, { useEffect, useRef, useState } from "react";
import { Trans } from "react-i18next";
import { AppInput } from "../../../../components/AppInput";
import { PopupModal } from "../../../../components/PopupModal";
import { config } from "../../../../config";
import { i18n } from "../../../../i18n";
import { resolveOobi } from "../../../../services/resolve-oobi";
import { isValidConnectionUrl } from "../../../../utils/urlChecker";
import "./AddConnectionModal.scss";
import { AddConnectionModalProps } from "./AddConnectionModal.types";

enum ContentType {
  SCANNER = "scanner",
  RESOLVING = "resolving",
  RESOLVED = "resolved",
}

const AddConnectionModal = ({
  openModal,
  setOpenModal,
  handleGetContacts,
}: AddConnectionModalProps) => {
  const [currentStage, setCurrentStage] = useState(1);
  const [showQR, setShowQR] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorOnRequest, setErrorOnRequest] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isInputValid, setIsInputValid] = useState(false);
  const [touched, setTouched] = useState(false);
  const [oobi, setOobi] = useState("");
  const [restartCamera, setRestartCamera] = useState(false);
  const [contentType, setContentType] = useState<ContentType>(
    ContentType.SCANNER
  );
  const [canReset, setCanReset] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const RESET_TIMEOUT = 1000;
  const { enqueueSnackbar } = useSnackbar();

  const triggerToast = (message: string, variant: VariantType) => {
    enqueueSnackbar(message, {
      variant,
      anchorOrigin: { vertical: "top", horizontal: "center" },
    });
  };

  useEffect(() => {
    handleShowQr();
  }, []);

  useEffect(() => {
    setCopied(false);
    setShowInput(false);
    setInputValue("");
    setIsInputValid(false);
    setTouched(false);
    handleReset();
  }, [currentStage]);

  const isCameraRendered = useRef<boolean>(false);
  const elementRef = useRef<HTMLDivElement | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    if (elementRef.current && !isCameraRendered.current && showInput) {
      isCameraRendered.current = true;
      const scanner = new Html5QrcodeScanner(
        "qr-reader",
        {
          qrbox: {
            width: 1024,
            height: 1024,
          },
          fps: 5,
        },
        false
      );

      scannerRef.current = scanner;

      const success = (result: string) => {
        scanner.clear();
        if (result && result.includes("oobi")) {
          handleResolveOobi(result);
        } else {
          triggerToast(
            i18n.t("pages.connections.addConnection.modal.toast.error"),
            "error"
          );
          restartScanner();
        }
      };

      const error = (_: unknown) => {};
      scanner.render(success, error);
    }
  }, [restartCamera, elementRef.current, showInput]);

  const restartScanner = async () => {
    isCameraRendered.current = false;
    setShowInput(false);
    setRestartCamera(!restartCamera);
    setContentType(ContentType.SCANNER);
  };

  const handleResolveOobi = async (oobi: string) => {
    const isValidOobi = oobi && oobi.includes("oobi");

    if (!isValidOobi) {
      triggerToast(
        i18n.t("pages.connections.addConnection.modal.toast.error"),
        "error"
      );
      return restartScanner();
    }

    setContentType(ContentType.RESOLVING);
    try {
      const fixedOobi =
        process.env.NODE_ENV === "development"
          ? oobi.replace("http://keria:", "http://localhost:")
          : oobi;

      await resolveOobi(fixedOobi);
      setContentType(ContentType.RESOLVED);
      setCanReset(true);
      triggerToast(
        i18n.t("pages.connections.addConnection.modal.toast.success"),
        "success"
      );
      await handleGetContacts();
      resetModal();
    } catch (error) {
      console.error("Error resolving OOBI:", error);
      triggerToast(
        i18n.t("pages.connections.addConnection.modal.toast.error"),
        "error"
      );
      setContentType(ContentType.SCANNER);
    }
  };

  const renderContent = () => {
    switch (contentType) {
      case ContentType.SCANNER:
        return {
          component: (
            <div
              ref={elementRef}
              id="qr-reader"
            />
          ),
          title: "Scan your wallet QR Code",
        };
      case ContentType.RESOLVING:
        return {
          component: <></>,
          title: "Resolving wallet connection",
        };
      case ContentType.RESOLVED:
        return {
          component: <></>,
          title: "Connected successfully",
        };
    }
  };
  const content = renderContent();

  const handleReset = () => {
    setCanReset(false);
    restartScanner();
  };

  const handleShowQr = async () => {
    const url = `${config.endpoint}${config.path.keriOobi}`;
    try {
      setShowQR(false);
      setLoading(true);
      setErrorOnRequest(false);
      setOobi("");

      try {
        const response = await axios(url);
        setOobi(response.data.data);
        setLoading(false);
        setShowQR(true);
      } catch (e) {
        console.error(e);
        setLoading(false);
        setErrorOnRequest(true);
      }
    } catch (error) {
      console.error("Error while trying to connect to the server.", error);
      setLoading(false);
      setErrorOnRequest(true);
    }
  };

  const handleCopyLink = () => {
    if (oobi) {
      setCopied(true);
      navigator.clipboard.writeText(oobi);
    }
  };

  const resetModal = () => {
    setOpenModal(false);
    if (scannerRef.current) {
      scannerRef.current.clear().catch((error) => {
        console.error("Failed to clear html5QrcodeScanner. ", error);
      });
    }
    setTimeout(() => {
      setCurrentStage(1);
      setErrorOnRequest(false);
      setCopied(false);
      setShowInput(false); // Ensure scanner is unmounted
    }, RESET_TIMEOUT);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setInputValue(value);
    setTouched(true);
    const isValid = isValidConnectionUrl(value);
    setIsInputValid(isValid);
  };

  return (
    <PopupModal
      open={openModal}
      onClose={resetModal}
      title={i18n.t("pages.connections.addConnection.modal.title")}
      customClass={`add-connection-modal stage-${currentStage}`}
      description={
        <Trans
          i18nKey={
            currentStage === 1
              ? "pages.connections.addConnection.modal.descriptionStepOne"
              : "pages.connections.addConnection.modal.descriptionStepTwo"
          }
          components={{ bold: <strong /> }}
        />
      }
      footer={
        <>
          {currentStage === 1 && (
            <>
              {errorOnRequest ? (
                <Button
                  variant="contained"
                  className="secondary-button"
                  onClick={handleShowQr}
                >
                  {i18n.t("pages.connections.addConnection.modal.button.retry")}
                  <RefreshOutlined />
                </Button>
              ) : (
                <Button
                  variant="contained"
                  className="secondary-button"
                  disabled={!oobi || copied}
                  onClick={handleCopyLink}
                >
                  {i18n.t(
                    copied
                      ? "pages.connections.addConnection.modal.button.copied"
                      : "pages.connections.addConnection.modal.button.copyConnectionId"
                  )}
                  {copied ? <CheckCircleOutlined /> : <ContentCopy />}
                </Button>
              )}
              <Button
                variant="contained"
                className="primary-button"
                disabled={!oobi || errorOnRequest}
                onClick={() => {
                  setCurrentStage(2);
                  if (scannerRef.current) {
                    scannerRef.current.pause();
                  }
                }}
              >
                {i18n.t("pages.connections.addConnection.modal.button.next")}
              </Button>
            </>
          )}
          {currentStage === 2 && (
            <>
              <Button
                variant="contained"
                className="neutral-button back-button"
                onClick={() => {
                  setCurrentStage(1);
                  handleReset();
                  if (scannerRef.current) {
                    scannerRef.current.clear().catch((error) => {
                      console.error(
                        "Failed to clear html5QrcodeScanner. ",
                        error
                      );
                    });
                  }
                }}
              >
                <ArrowBack />
                {i18n.t("pages.connections.addConnection.modal.button.back")}
              </Button>
              <Button
                variant="contained"
                className="primary-button"
                onClick={() => handleResolveOobi(inputValue || oobi)}
                disabled={!(isInputValid && oobi && oobi.includes("oobi"))}
              >
                {i18n.t(
                  "pages.connections.addConnection.modal.button.complete"
                )}
              </Button>
            </>
          )}
        </>
      }
    >
      {currentStage === 1 && (
        <div className="connection-qr">
          {loading && (
            <div className="connection-loading">
              <QrCodeRounded className="qr-code-icon" />
              <CircularProgress className="loading-spinner" />
            </div>
          )}
          {showQR && (
            <QRCodeSVG
              value={oobi}
              size={280}
            />
          )}
          {errorOnRequest && (
            <div className="error-on-request">
              <WarningAmber />
              <Typography>
                {i18n.t("pages.connections.addConnection.modal.errorOnRequest")}
              </Typography>
            </div>
          )}
        </div>
      )}
      {currentStage === 2 && (
        <>
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography
                component="span"
                className="accordion-collapsed"
              >
                {i18n.t("pages.connections.addConnection.modal.learnMore")}
              </Typography>
              <Typography
                component="span"
                className="accordion-expanded"
              >
                {i18n.t("pages.connections.addConnection.modal.showLess")}
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography>
                <Trans
                  i18nKey="pages.connections.addConnection.modal.descriptionLearnMore"
                  components={{ moreVertIcon: <MoreVert /> }}
                />
              </Typography>
            </AccordionDetails>
          </Accordion>
          {!canReset && (
            <>
              {showInput ? (
                content?.component
              ) : (
                <Box className="camera-button-container">
                  <Button
                    className="camera-button"
                    onClick={() => setShowInput(true)}
                  >
                    <PhotoCamera />
                  </Button>
                  <Typography onClick={() => setShowInput(true)}>
                    {i18n.t(
                      "pages.connections.addConnection.modal.button.openCamera"
                    )}
                  </Typography>
                </Box>
              )}
              <AppInput
                label={i18n.t("pages.connections.addConnection.modal.pasteUrl")}
                id="connection-url-input"
                value={inputValue}
                onChange={handleInputChange}
                error={!isInputValid && touched}
                className="connection-url-form"
                errorMessage={i18n.t(
                  "pages.connections.addConnection.modal.button.errorMessage"
                )}
              />
            </>
          )}
        </>
      )}
    </PopupModal>
  );
};

export { AddConnectionModal };
