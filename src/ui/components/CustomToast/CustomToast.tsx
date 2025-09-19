import { createAnimation, IonToast } from "@ionic/react";
import { closeOutline } from "ionicons/icons";
import { useCallback } from "react";
import { i18n } from "../../../i18n";
import { useAppDispatch } from "../../../store/hooks";
import { removeToastMessage } from "../../../store/reducers/stateCache";
import { useScreenSize } from "../../hooks";
import "./CustomToast.scss";
import { ToastMessageProps } from "./CustomToast.types";

const TOAST_HEIGHT = 52;
// Toast height on small screen
const SMALL_TOAST_HEIGHT = 45;
const TOAST_ANIMATION_DURATION = 350;
const TOAST_DURATION = 2500;

const CustomToast = ({
  toastMsg,
  index,
  showToast = true,
  setShowToast,
}: ToastMessageProps) => {
  const { id, message } = toastMsg;
  const width = useScreenSize();

  const dispatch = useAppDispatch();

  // Note: caculate toast position
  const toastPosition = (() => {
    const isSmallDevice = width >= 250 && width <= 370;

    return index * ((isSmallDevice ? SMALL_TOAST_HEIGHT : TOAST_HEIGHT) + 8);
  })();

  const endAnimation = useCallback((baseEl: HTMLElement) => {
    return createAnimation()
      .addElement(baseEl)
      .duration(TOAST_ANIMATION_DURATION)
      .fromTo("opacity", "1", "0");
  }, []);

  const handleDismissToast = () => {
    setShowToast?.(false);
    dispatch(removeToastMessage(id));
  };

  const styles = {
    transform: index > 0 ? `translateY(${toastPosition}px)` : undefined,
  };

  return (
    <IonToast
      isOpen={showToast}
      className="custom-toast"
      style={styles}
      onDidDismiss={handleDismissToast}
      message={message && `${i18n.t("toast." + message.toLowerCase())}`}
      color={message?.toLowerCase().includes("error") ? "danger" : "secondary"}
      position="top"
      data-testid={`confirmation-toast-${id}`}
      cssClass="confirmation-toast"
      duration={TOAST_DURATION}
      leaveAnimation={endAnimation}
      buttons={[
        {
          icon: closeOutline,
          role: "cancel",
        },
      ]}
    />
  );
};

export { CustomToast };
