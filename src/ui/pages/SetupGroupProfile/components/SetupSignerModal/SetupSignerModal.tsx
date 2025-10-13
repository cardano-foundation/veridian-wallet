import { IonButton, IonIcon, IonModal } from "@ionic/react";
import { addOutline, removeOutline } from "ionicons/icons";
import { useCallback, useEffect, useState } from "react";
import { i18n } from "../../../../../i18n";
import { CustomInput } from "../../../../components/CustomInput";
import { ErrorMessage } from "../../../../components/ErrorMessage";
import { InfoCard } from "../../../../components/InfoCard";
import { ScrollablePageLayout } from "../../../../components/layout/ScrollablePageLayout";
import { PageFooter } from "../../../../components/PageFooter";
import { PageHeader } from "../../../../components/PageHeader";
import { combineClassNames } from "../../../../utils/style";
import "./SetupSignerModal.scss";
import {
  SetupSignerModalProps,
  SignerData,
  SignerInputProps,
} from "./SetupSignerModal.types";

const SignerInput = ({
  label,
  name,
  value,
  onChange,
  maxValue,
}: SignerInputProps) => {
  const [touched, setTouched] = useState(false);

  const errorMessage = (() => {
    if (!touched) return;

    if (Number(value) < 1) {
      return "setupgroupprofile.initgroup.setsigner.error.min";
    }

    if (Number(value) > maxValue) {
      return "setupgroupprofile.initgroup.setsigner.error.max";
    }

    return null;
  })();

  const decreaseButtonClass = combineClassNames("decrease-threshold-button", {
    inactive: Number(value) <= 1,
  });

  const increaseButtonClass = combineClassNames("increase-threshold-button", {
    inactive: maxValue <= Number(value),
  });

  const handleClickChange = (name: keyof SignerData, value: number) => {
    if (value < 1 || value > maxValue) return;

    onChange(name, value);
  };

  const handleChangeValue = (name: keyof SignerData, value: string) => {
    const numberValue = value !== "" ? Number(value) : null;

    if (numberValue !== null && isNaN(numberValue)) return;

    onChange(name, numberValue);
  };

  return (
    <>
      <CustomInput
        title={label}
        className="signer-threshold"
        dataTestId={`threshold-${name}`}
        value={`${value === null ? "" : value}`}
        onChangeInput={(value) => handleChangeValue(name, value)}
        inputMode="numeric"
        error={!!errorMessage}
        onChangeFocus={(focus) => {
          if (!focus) {
            setTouched(true);
          }
        }}
        endAction={
          <div className="signer-threshold-controls">
            <IonButton
              shape="round"
              className={decreaseButtonClass}
              data-testid={`${name}-decrease-threshold-button`}
              onClick={() => handleClickChange(name, Number(value) - 1)}
            >
              <IonIcon
                slot="icon-only"
                icon={removeOutline}
                color="primary"
              />
            </IonButton>
            <IonButton
              shape="round"
              className={increaseButtonClass}
              data-testid={`${name}-increase-threshold-button`}
              onClick={() => handleClickChange(name, Number(value) + 1)}
            >
              <IonIcon
                slot="icon-only"
                icon={addOutline}
                color="primary"
              />
            </IonButton>
          </div>
        }
      />
      {errorMessage && <ErrorMessage message={`${i18n.t(errorMessage)}`} />}
    </>
  );
};

export const SetupSignerModal = ({
  isOpen,
  connectionsLength,
  currentValue,
  setOpen,
  onSubmit,
}: SetupSignerModalProps) => {
  const [data, setData] = useState<SignerData>({
    recoverySigners: null,
    requiredSigners: null,
  });

  const handleClose = () => {
    setOpen(false);
  };

  const handleSubmit = () => {
    onSubmit(data);
    handleClose();
  };

  const isValidData = useCallback(
    (signer: number | null) => {
      return signer !== null && signer >= 1 && signer <= connectionsLength;
    },
    [connectionsLength]
  );

  useEffect(() => {
    if (
      isOpen &&
      isValidData(Number(currentValue.recoverySigners)) &&
      isValidData(Number(currentValue.requiredSigners))
    )
      setData({ ...currentValue });
  }, [isOpen, currentValue, isValidData]);

  const setField = (name: keyof SignerData, value: number | null) => {
    setData((values) => ({
      ...values,
      [name]: value,
    }));
  };

  return (
    <IonModal
      isOpen={isOpen}
      className="setup-signer-modal"
      data-testid="setup-signer-modal"
      onDidDismiss={handleClose}
    >
      <ScrollablePageLayout
        pageId="setup-signer-modal-content"
        header={
          <PageHeader
            closeButton={true}
            closeButtonLabel={`${i18n.t(
              "setupgroupprofile.initgroup.setsigner.button.back"
            )}`}
            closeButtonAction={handleClose}
            title={`${i18n.t("setupgroupprofile.initgroup.setsigner.title")}`}
          />
        }
        footer={
          <PageFooter
            pageId="setup-signer-modal"
            primaryButtonText={`${i18n.t(
              "setupgroupprofile.initgroup.setsigner.button.confirm"
            )}`}
            primaryButtonAction={handleSubmit}
            primaryButtonDisabled={
              !isValidData(Number(data.recoverySigners)) ||
              !isValidData(Number(data.requiredSigners))
            }
          />
        }
      >
        <p className="header-text">
          {i18n.t("setupgroupprofile.initgroup.setsigner.text")}
        </p>
        <SignerInput
          label={i18n.t(
            "setupgroupprofile.initgroup.setsigner.requiredsigners"
          )}
          name="requiredSigners"
          onChange={setField}
          maxValue={connectionsLength}
          value={data.requiredSigners}
        />
        <InfoCard
          content={i18n.t(
            "setupgroupprofile.initgroup.setsigner.requiredsignershelptext"
          )}
        />

        <SignerInput
          label={i18n.t(
            "setupgroupprofile.initgroup.setsigner.recoverysigners"
          )}
          name="recoverySigners"
          onChange={setField}
          maxValue={connectionsLength}
          value={data.recoverySigners}
        />
        <InfoCard
          content={i18n.t(
            "setupgroupprofile.initgroup.setsigner.recoverysignershelptext"
          )}
        />
      </ScrollablePageLayout>
    </IonModal>
  );
};
