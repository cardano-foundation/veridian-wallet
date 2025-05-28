import { IonSearchbar } from "@ionic/react";
import { i18n } from "../../../../../i18n";
import "./ConnectionsBody.scss";
import { SearchInputProps } from "../SearchInput/SearchInput.types";

const SearchInput = ({ onFocus, onInputChange, value }: SearchInputProps) => {
  const showCancel = value ? "always" : "focus";

  const handleBlur = () => {
    if (value) return;
    onFocus?.(false);
  };

  const handleCancer = () => {
    onFocus?.(false);
  };

  return (
    <IonSearchbar
      className="connection-search-input"
      data-testid="search-bar"
      showCancelButton={showCancel}
      onIonCancel={handleCancer}
      debounce={100}
      onIonFocus={() => onFocus?.(true)}
      onIonBlur={handleBlur}
      value={value}
      onIonInput={(e) => {
        onInputChange(e.target.value || "");
      }}
      placeholder={`${i18n.t("connections.page.search.placeholder")}`}
    />
  );
};

export { SearchInput };
