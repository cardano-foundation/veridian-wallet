/* global HTMLIonInputElement */
import { IonButton, IonChip, IonIcon, IonInput } from "@ionic/react";
import { eyeOffOutline } from "ionicons/icons";
import { forwardRef, useImperativeHandle, useRef } from "react";
import { i18n } from "../../../i18n";
import { combineClassNames } from "../../utils/style";
import "./SeedPhraseModule.scss";
import {
  SeedPhraseModuleProps,
  SeedPhraseModuleRef,
} from "./SeedPhraseModule.types";
import { useHideKeyboard } from "../../hooks/useHideKeyboard";

const SeedPhraseModule = forwardRef<SeedPhraseModuleRef, SeedPhraseModuleProps>(
  (
    {
      testId,
      seedPhrase,
      hideSeedPhrase,
      setHideSeedPhrase,
      addSeedPhraseSelected,
      removeSeedPhraseSelected,
      emptyWord,
      hideSeedNumber,
      showSeedPhraseButton = true,
      inputMode,
      errorInputIndexs,
      onInputChange,
      onInputBlur,
      onInputFocus,
      overlayText,
    },
    ref
  ) => {
    const seedInputs = useRef<(HTMLIonInputElement | null)[]>([]);
    const { hideKeyboard } = useHideKeyboard();

    useImperativeHandle(ref, () => ({
      focusInputByIndex: (index) => {
        const input = seedInputs.current.at(index);
        if (!input) return;

        (input as any).setFocus();
      },
    }));

    const getClassName = (word: string, index: number) => {
      if (!inputMode) return;

      return combineClassNames("seed-chips", {
        "empty-word": !word && index === seedPhrase.length - 1,
        "empty-word error":
          !!errorInputIndexs?.includes(index) ||
          (!word && index !== seedPhrase.length - 1),
      });
    };

    return (
      <div
        data-testid="seed-phrase-module"
        className={`seed-phrase-module ${
          hideSeedPhrase ? "seed-phrase-hidden" : "seed-phrase-visible"
        }`}
      >
        <div
          data-testid="seed-phrase-privacy-overlay"
          className="overlay"
        >
          <IonIcon icon={eyeOffOutline} />
          <p data-testid="seed-phrase-privacy-overlay-text">
            {overlayText || i18n.t("generateseedphrase.privacy.overlay.text")}
          </p>
          {showSeedPhraseButton && (
            <IonButton
              fill="outline"
              data-testid="reveal-seed-phrase-button"
              onClick={() => setHideSeedPhrase && setHideSeedPhrase(false)}
            >
              {i18n.t("generateseedphrase.privacy.overlay.button")}
            </IonButton>
          )}
        </div>
        <div
          data-testid={testId}
          className="seed-phrase-container"
        >
          {seedPhrase.map((word, index) => {
            return (
              <IonChip
                key={index}
                onClick={() => {
                  if (removeSeedPhraseSelected) {
                    removeSeedPhraseSelected(index);
                  } else if (addSeedPhraseSelected) {
                    addSeedPhraseSelected(word);
                  }
                }}
                className={getClassName(word, index)}
              >
                {!hideSeedNumber && (
                  <span
                    data-testid={`word-index-number-${index}`}
                    className="index"
                  >
                    {index + 1}.
                  </span>
                )}
                {inputMode ? (
                  <IonInput
                    className="word-input"
                    ref={(ref) => (seedInputs.current[index] = ref)}
                    value={word}
                    onIonInput={(e) => {
                      onInputChange?.(e.target.value as string, index);
                    }}
                    onIonFocus={() => onInputFocus?.(index)}
                    onIonBlur={() => onInputBlur?.(index)}
                    name={`word-input-${index}`}
                    id={`word-input-${index}`}
                    data-testid={`word-input-${index}`}
                    onKeyDown={hideKeyboard}
                  />
                ) : (
                  <span data-testid={`word-index-${index + 1}`}>{word}</span>
                )}
              </IonChip>
            );
          })}
          {emptyWord && (
            <IonChip
              className="empty-word"
              data-testid={`empty-word-${seedPhrase.length + 1}`}
            >
              <span className="index">{seedPhrase.length + 1}.</span>
            </IonChip>
          )}
        </div>
      </div>
    );
  }
);

export { SeedPhraseModule };
