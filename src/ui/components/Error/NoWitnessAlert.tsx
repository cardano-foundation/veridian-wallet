import { IonButton, IonIcon } from "@ionic/react";
import { alertCircleOutline } from "ionicons/icons";
import { useCallback, useState } from "react";
import { useHistory } from "react-router-dom";
import { Agent } from "../../../core/agent/agent";
import { IdentifierService } from "../../../core/agent/services";
import { i18n } from "../../../i18n";
import { RoutePath } from "../../../routes";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import {
  getShowNoWitnessAlert,
  showNoWitnessAlert,
} from "../../../store/reducers/stateCache";
import { showError } from "../../utils/error";
import { ResponsivePageLayout } from "../layout/ResponsivePageLayout";
import { PageHeader } from "../PageHeader";
import { Spinner } from "../Spinner";
import "./NoWitnessAlert.scss";

const NoWitnessAlert = () => {
  const dispatch = useAppDispatch();
  const isShowNoWitnessAlert = useAppSelector(getShowNoWitnessAlert);
  const [loading, setLoading] = useState(false);
  const history = useHistory();

  const checkAgain = useCallback(async () => {
    try {
      setLoading(true);
      await Agent.agent.identifiers.getAvailableWitnesses();
      dispatch(showNoWitnessAlert(false));
    } catch (e) {
      if (
        e instanceof Error &&
        (e.message.includes(
          IdentifierService.INSUFFICIENT_WITNESSES_AVAILABLE
        ) ||
          e.message.includes(
            IdentifierService.MISCONFIGURED_AGENT_CONFIGURATION
          ))
      ) {
        dispatch(showNoWitnessAlert(true));
        return;
      }

      showError("failed to get available witness", e);
    } finally {
      setLoading(false);
    }
  }, [dispatch]);

  if (!isShowNoWitnessAlert) return null;

  return (
    <ResponsivePageLayout
      activeStatus
      pageId="no-witness"
      customClass="no-witness-page"
      header={
        <PageHeader
          closeButton={history.location.pathname != RoutePath.PROFILE_SETUP}
          closeButtonLabel={`${i18n.t("nowitnesserror.close")}`}
          closeButtonAction={() => dispatch(showNoWitnessAlert(false))}
        />
      }
    >
      <div className="page-content-container">
        <div className="page-content">
          <IonIcon
            className="icon"
            icon={alertCircleOutline}
          />
          <h1>{i18n.t("nowitnesserror.title")}</h1>
          <p>{i18n.t("nowitnesserror.description")}</p>
        </div>
      </div>
      <IonButton
        shape="round"
        expand="block"
        className="primary-button"
        onClick={checkAgain}
      >
        {i18n.t("nowitnesserror.button")}
      </IonButton>
      <Spinner show={loading} />
    </ResponsivePageLayout>
  );
};

export { NoWitnessAlert };
