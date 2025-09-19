import { useState } from "react";
import { i18n } from "../../../../../i18n";
import { TermsModal } from "../../../TermsModal";
import { ListCard } from "../../../ListCard/ListCard";
import { ListItem } from "../../../ListCard/ListItem/ListItem";
const TermsAndPrivacy = () => {
  const [openTerms, setOpenTerms] = useState(false);
  const [openPrivacy, setOpenPrivacy] = useState(false);

  return (
    <>
      <div className="settings-section-title-placeholder" />
      <ListCard
        items={[
          {
            id: "terms-of-use",
            label: i18n.t("settings.sections.support.terms.submenu.termsofuse"),
          },
          {
            id: "privacy-policy",
            label: i18n.t("settings.sections.support.terms.submenu.privacy"),
          },
        ]}
        renderItem={(item) => (
          <ListItem
            key={item.id}
            onClick={() =>
              item.id === "terms-of-use"
                ? setOpenTerms(true)
                : setOpenPrivacy(true)
            }
            testId={`${item.id}-modal-btn`}
            className="list-item"
            label={item.label}
          />
        )}
        testId="settings-security-items"
      />
      <TermsModal
        name="terms-of-use"
        isOpen={openTerms}
        setIsOpen={setOpenTerms}
        altIsOpen={setOpenPrivacy}
      />
      <TermsModal
        name="privacy-policy"
        isOpen={openPrivacy}
        setIsOpen={setOpenPrivacy}
        altIsOpen={setOpenTerms}
      />
    </>
  );
};

export { TermsAndPrivacy };
