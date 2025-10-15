import { FallbackIcon } from "../../../components/FallbackIcon";
import { formatShortDate } from "../../../utils/formatters";
import "./ConnectionDetailsHeader.scss";
import { ConnectionDetailsHeaderProps } from "./ConnectionDetailsHeader.types";
import MyFamilyPortal from "../../../assets/images/myfamily-portal.svg";
import Socialbook from "../../../assets/images/socialbook.svg";
import Mary from "../../../assets/images/Mary.jpg";
import Oliver from "../../../assets/images/Oliver.jpg";
import StateOfUtah from "../../../assets/images/state-of-utah.png";

const ConnectionDetailsHeader = ({
  logo,
  label,
  date,
}: ConnectionDetailsHeaderProps) => {
  const customLogo = (() => {
    if (label === "MyFamily Portal") {
      return (
        <div className="myfamily-portal-logo-container">
          <img
            src={MyFamilyPortal}
            alt={label}
            className="card-logo"
            data-testid="card-logo"
          />
        </div>
      );
    }

    if (label === "Socialbook") {
      return (
        <div className="socialbook-logo-container">
          <img
            src={Socialbook}
            alt={label}
            className="card-logo"
            data-testid="card-logo"
          />
        </div>
      );
    }

    if (label === "Mary") {
      return (
        <div className="mary-logo-container">
          <img
            src={Mary}
            alt={label}
            className="card-logo"
            data-testid="card-logo"
          />
        </div>
      );
    }

    if (label === "Oliver") {
      return (
        <div className="oliver-logo-container">
          <img
            src={Oliver}
            alt={label}
            className="card-logo"
            data-testid="card-logo"
          />
        </div>
      );
    }

    if (label === "State of Utah") {
      return (
        <div className="state-of-utah-logo-container">
          <img
            src={StateOfUtah}
            alt={label}
            className="card-logo"
            data-testid="card-logo"
          />
        </div>
      );
    }

    return (
      <FallbackIcon
        src={logo}
        alt="connection-logo"
      />
    );
  })();
  return (
    <div className="connection-details-header">
      <div className="connection-details-logo">{customLogo}</div>
      <h2 data-testid="connection-name">{label}</h2>
      <p data-testid="data-connection-time">{formatShortDate(`${date}`)}</p>
    </div>
  );
};

export default ConnectionDetailsHeader;
