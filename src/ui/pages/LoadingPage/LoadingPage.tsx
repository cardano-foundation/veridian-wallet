import { IonSpinner } from "@ionic/react";
import "./LoadingPage.scss";
import { LoadingPageProps, LoadingType } from "./LoadingPage.types";
import splashImage from "../../assets/images/Splash.jpg";
import { combineClassNames } from "../../utils/style";

const LoadingPage = ({
  type = LoadingType.Spin,
  fullPage,
}: LoadingPageProps) => {
  return (
    <div
      data-testid="loading-page"
      className={combineClassNames("loading-page", {
        "full-page": !!fullPage,
      })}
      style={
        type === LoadingType.Splash
          ? {
            background: `url(${splashImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }
          : undefined
      }
    >
      {type === LoadingType.Spin && <IonSpinner name="crescent" />}
    </div>
  );
};

export { LoadingPage };
