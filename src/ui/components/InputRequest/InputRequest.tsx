import { IonModal, isPlatform } from "@ionic/react";
import { useEffect, useState } from "react";
import { OobiQueryParams } from "../../../core/agent/services/connectionService.types";
import { i18n } from "../../../i18n";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import {
  getMissingAliasConnection,
  setMissingAliasConnection,
} from "../../../store/reducers/profileCache";
import { nameChecker } from "../../utils/nameChecker";
import { CustomInput } from "../CustomInput";
import { ErrorMessage } from "../ErrorMessage";
import { PageFooter } from "../PageFooter";
import { useScanHandle } from "../Scan/hook/useScanHandle";
import "./InputRequest.scss";

const InputRequest = () => {
  const dispatch = useAppDispatch();
  const missingAliasConnection = useAppSelector(getMissingAliasConnection);
  const missingAliasUrl = missingAliasConnection?.url;
  const { resolveIndividualConnection } = useScanHandle();

  const componentId = "input-request";
  const [inputChange, setInputChange] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const errorMessage = inputChange
    ? nameChecker.getError(inputValue, true)
    : undefined;

  const showModal = !!missingAliasUrl;

  useEffect(() => {
    if (!showModal) {
      setInputChange(false);
    }
  }, [showModal]);

  const resolveConnectionOobi = async (content: string) => {
    resolveIndividualConnection(content);
  };

  const handleConfirm = () => {
    if (errorMessage) return;

    if (missingAliasUrl) {
      if (!missingAliasUrl) return;
      const url = new URL(missingAliasUrl);
      url.searchParams.set(OobiQueryParams.NAME, inputValue);
      resolveConnectionOobi(url.toString());
      dispatch(setMissingAliasConnection(undefined));
      setInputValue("");
      return;
    }
  };

  const title = missingAliasUrl
    ? i18n.t("inputrequest.title.connectionalias")
    : i18n.t("inputrequest.title.username");

  return (
    <IonModal
      isOpen={showModal}
      id={componentId}
      data-testid={`${componentId}-modal`}
      className={missingAliasUrl ? "connection-alias" : undefined}
      backdropDismiss={false}
      animated={!isPlatform("ios") || !!missingAliasUrl}
    >
      <div className={`${componentId}-wrapper`}>
        <h3>{title}</h3>
        <CustomInput
          dataTestId={`${componentId}-input`}
          title={`${i18n.t("inputrequest.input.title")}`}
          hiddenInput={false}
          autofocus={true}
          onChangeInput={(value) => {
            setInputValue(value);
            setInputChange(true);
          }}
          value={inputValue}
          error={!!errorMessage && inputChange}
        />
        <ErrorMessage message={errorMessage} />
        <PageFooter
          pageId={componentId}
          primaryButtonDisabled={inputValue.trim().length === 0}
          primaryButtonText={`${i18n.t("inputrequest.button.confirm")}`}
          primaryButtonAction={() => handleConfirm()}
        />
      </div>
    </IonModal>
  );
};

export { InputRequest };
