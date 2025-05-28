import { FallbackIcon } from "../../../components/FallbackIcon";
import { formatShortDate } from "../../../utils/formatters";
import "./ConnectionDetailsHeader.scss";
import { ConnectionDetailsHeaderProps } from "./ConnectionDetailsHeader.types";

const ConnectionDetailsHeader = ({
  logo,
  label,
  date,
}: ConnectionDetailsHeaderProps) => {
  return (
    <div className="connection-details-header">
      <div className="connection-details-logo">
        <FallbackIcon
          src={logo}
          alt="connection-logo"
        />
      </div>
      <h2 data-testid="connection-name">{label}</h2>
      <p data-testid="data-connection-time">{formatShortDate(`${date}`)}</p>
    </div>
  );
};

export default ConnectionDetailsHeader;
