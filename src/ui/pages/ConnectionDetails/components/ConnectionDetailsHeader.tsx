import { FallbackIcon } from "../../../components/FallbackIcon";
import { formatShortDate } from "../../../utils/formatters";
import "./ConnectionDetailsHeader.scss";
import { ConnectionDetailsHeaderProps } from "./ConnectionDetailsHeader.types";
import CitizenPortal from "../../../assets/images/citizen-portal.svg";
import Socialbook from "../../../assets/images/socialbook.svg";
import Mary from "../../../assets/images/Mary.jpg";
import Oliver from "../../../assets/images/Oliver.jpg";
import VitalRecordsAdmin from "../../../assets/images/vital-records-admin.png";

const ConnectionDetailsHeader = ({
  logo,
  label,
  date,
}: ConnectionDetailsHeaderProps) => {
  const customLogo = (() => {
    if (label === "Citizen Portal") {
      return (
        <div className="citizen-portal-logo-container">
          <img
            src={CitizenPortal}
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
        <div className="vital-records-admin-logo-container">
          <img
            src={VitalRecordsAdmin}
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
