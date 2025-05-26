import { IonSearchbar } from "@ionic/react";
import { SearchInputProps } from "./SearchInput.types";
import { i18n } from "../../../../../i18n";

const SearchInput = ({ onFocus, onInputChange, value }: SearchInputProps) => {
  const showCancel = value ? "always" : "focus";

  const handleBlur = () => {
    if (value) return;
    onFocus?.(false);
  };

  const handleCancel = () => {
    onFocus?.(false);
  };

  return (
    <IonSearchbar
      className="connection-search-input"
      showCancelButton={showCancel}
      onIonCancel={handleCancel}
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
