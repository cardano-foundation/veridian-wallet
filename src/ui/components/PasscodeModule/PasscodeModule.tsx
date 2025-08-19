import { IonButton, IonCol, IonGrid, IonIcon, IonRow } from "@ionic/react";
import { backspaceSharp, fingerPrintSharp } from "ionicons/icons";
import { useSelector } from "react-redux";
import { BiometryType } from "@aparajita/capacitor-biometric-auth";
import { PasscodeModuleProps } from "./PasscodeModule.types";
import "./PasscodeModule.scss";
import { PASSCODE_MAPPING } from "../../globals/types";
import { useBiometricAuth } from "../../hooks/useBiometricsHook";
import { getBiometricsCache } from "../../../store/reducers/biometricsCache";
import faceIdIcon from "../../assets/images/face-id.png";

const PasscodeModule = ({
  error,
  passcode,
  hasError,
  handlePinChange,
  handleRemove,
  handleBiometricButtonClick,
}: PasscodeModuleProps) => {
  const biometricsCache = useSelector(getBiometricsCache);
  const { biometricInfo } = useBiometricAuth();
  const numbers = PASSCODE_MAPPING.numbers;
  const labels = PASSCODE_MAPPING.labels;
  const rows = [];
  let currentRow: number[] = [];

  numbers.forEach((number, index) => {
    if (index % 3 === 0) {
      rows.push(currentRow);
      currentRow = [];
    }
    currentRow.push(number);
  });
  rows.push(currentRow);

  const handleBiometricButton = () => {
    handleBiometricButtonClick && handleBiometricButtonClick();
  };

  const getBiometricIcon = () => {
    if (!biometricInfo) return null;

    if (
      [BiometryType.faceAuthentication, BiometryType.faceId].includes(
        biometricInfo?.biometryType
      )
    ) {
      return (
        <img
          src={faceIdIcon}
          alt="face-id"
        />
      );
    }

    return (
      <IonIcon
        slot="icon-only"
        className="passcode-module-fingerprint-icon"
        icon={fingerPrintSharp}
      />
    );
  };

  return (
    <>
      <div className="passcode-module-circle-row">
        {Array.from({ length: 6 }, (_, index) => (
          <div
            key={index}
            data-testid={`circle-${index}`}
            className={`passcode-module-circle ${
              passcode.length <= index ? "" : "passcode-module-circle-fill"
            }`}
          />
        ))}
      </div>
      {error}
      <IonGrid
        className="passcode-module-container"
        data-testid="passcode-module-container"
      >
        {rows.map(
          (row, rowIndex) =>
            rowIndex !== 0 && (
              <IonRow
                className={`passcode-module-numbers-row ${rowIndex}`}
                key={rowIndex}
              >
                {rowIndex === rows.length - 1 && (
                  <IonCol>
                    {handleBiometricButtonClick &&
                    biometricsCache.enabled &&
                    biometricInfo?.strongBiometryIsAvailable &&
                    biometricInfo?.isAvailable ? (
                        <IonButton
                          data-testid="passcode-button-#"
                          className="passcode-module-number-button"
                          disabled={hasError}
                          onClick={() =>
                            biometricInfo?.strongBiometryIsAvailable &&
                          handleBiometricButton()
                          }
                        >
                          {getBiometricIcon()}
                        </IonButton>
                      ) : null}
                  </IonCol>
                )}

                {row.map((number, colIndex) => (
                  <IonCol key={colIndex}>
                    <IonButton
                      data-testid={`passcode-button-${number}`}
                      className="passcode-module-number-button"
                      onClick={() => handlePinChange(number)}
                      id={`passcode-button-${number}`}
                      disabled={hasError}
                    >
                      <div className="passcode-module-number-button-inner">
                        {number}
                        {labels[number - 1]?.map((label, labelIndex) => (
                          <div
                            className="passcode-module-number-labels"
                            key={labelIndex}
                          >
                            {label.split("").map((char, charIndex) => (
                              <span key={charIndex}>{char}</span>
                            ))}
                          </div>
                        ))}
                      </div>
                    </IonButton>
                  </IonCol>
                ))}
                {rowIndex === rows.length - 1 && (
                  <IonCol>
                    {passcode !== "" && !hasError && (
                      <IonButton
                        className="passcode-module-backspace-button"
                        data-testid="setpasscode-backspace-button"
                        onClick={() => handleRemove()}
                        disabled={hasError}
                      >
                        <IonIcon
                          slot="icon-only"
                          className="passcode-module-backspace-icon"
                          icon={backspaceSharp}
                        />
                      </IonButton>
                    )}
                  </IonCol>
                )}
              </IonRow>
            )
        )}
      </IonGrid>
    </>
  );
};

export { PasscodeModule };
