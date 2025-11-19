import { IonButton, IonIcon } from "@ionic/react";
import { alertCircleOutline } from "ionicons/icons";
import { useCallback } from "react";
import { i18n } from "../../../i18n";
import { useAppDispatch, useAppSelector } from "../../../store/hooks";
import {
  getShowNoWitnessAlert,
  showNoWitnessAlert,
} from "../../../store/reducers/stateCache";
import { ResponsivePageLayout } from "../layout/ResponsivePageLayout";
import "./NoWitnessAlert.scss";

const NoWitnessAlert = () => {
  const dispatch = useAppDispatch();
  const isShowNoWitnessAlert = useAppSelector(getShowNoWitnessAlert);

  const closeAlert = useCallback(() => {
    dispatch(showNoWitnessAlert(false));
  }, [dispatch]);

  if (!isShowNoWitnessAlert) return null;

  return (
    <ResponsivePageLayout
      activeStatus
      pageId="no-witness"
      customClass="no-witness-page"
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
        onClick={closeAlert}
      >
        {i18n.t("nowitnesserror.button")}
      </IonButton>
    </ResponsivePageLayout>
  );
};

export { NoWitnessAlert };
