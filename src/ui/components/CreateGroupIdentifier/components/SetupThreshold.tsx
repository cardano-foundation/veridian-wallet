import { IonButton, IonIcon } from "@ionic/react";
import { addOutline, removeOutline } from "ionicons/icons";
import { i18n } from "../../../../i18n";
import { PageFooter } from "../../PageFooter";
import { PageHeader } from "../../PageHeader";
import { IdentifierStageProps, Stage } from "../CreateGroupIdentifier.types";
import { ScrollablePageLayout } from "../../layout/ScrollablePageLayout";
import { combineClassNames } from "../../../utils/style";

const SetupThreshold = ({
  state,
  setState,
  componentId,
}: IdentifierStageProps) => {
  const updateThreshold = (amount: number) => {
    const newThreshold = state.threshold + amount;

    if (
      newThreshold < 1 ||
      newThreshold > state.selectedConnections.length + 1
    ) {
      return;
    }

    setState((prevState) => ({
      ...prevState,
      threshold: newThreshold,
    }));
  };

  const handleContinue = () => {
    setState((prevState) => ({
      ...prevState,
      identifierCreationStage: Stage.Summary,
    }));
  };

  const decreaseButtonClass = combineClassNames("decrease-threshold-button", {
    inactive: state.threshold === 1,
  });

  const increaseButtonClass = combineClassNames("increase-threshold-button", {
    inactive: state.scannedConections.length + 1 === state.threshold,
  });

  return (
    <ScrollablePageLayout
      pageId={componentId + "-content"}
      header={
        <PageHeader
          closeButton={true}
          closeButtonLabel={`${i18n.t("createidentifier.back")}`}
          closeButtonAction={() => {
            setState((prevState) => ({
              ...prevState,
              threshold: 1,
              identifierCreationStage: Stage.Members,
            }));
          }}
          title={`${i18n.t("createidentifier.threshold.title")}`}
        />
      }
      footer={
        <PageFooter
          pageId={componentId}
          primaryButtonText={`${i18n.t("createidentifier.threshold.continue")}`}
          primaryButtonAction={() => handleContinue()}
        />
      }
    >
      <p className="multisig-subtitle">
        {i18n.t("createidentifier.threshold.subtitle")}
      </p>
      <div className="identifier-threshold">
        <div className="identifier-threshold-title">
          {i18n.t("createidentifier.threshold.label")}
        </div>
        <div className="identifier-threshold-items">
          <div className="identifier-threshold-amount">{state.threshold}</div>
          <div className="identifier-threshold-controls">
            <IonButton
              shape="round"
              className={decreaseButtonClass}
              data-testid="decrease-threshold-button"
              onClick={() => updateThreshold(-1)}
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
              data-testid="increase-threshold-button"
              onClick={() => updateThreshold(1)}
            >
              <IonIcon
                slot="icon-only"
                icon={addOutline}
                color="primary"
              />
            </IonButton>
          </div>
        </div>
      </div>
    </ScrollablePageLayout>
  );
};

export { SetupThreshold };
