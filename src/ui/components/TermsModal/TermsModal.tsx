import { IonModal } from "@ionic/react";
import { t } from "i18next";
import { Trans } from "react-i18next";
import { i18n } from "../../../i18n";
import {
  DATA_PROTECTION_AUTHORITIES_LINK,
  FEDERAL_DATA_PROTECTION_LINK,
  SUPPORT_EMAIL,
} from "../../globals/constants";
import { openBrowserLink } from "../../utils/openBrowserLink";
import { ScrollablePageLayout } from "../layout/ScrollablePageLayout";
import { PageHeader } from "../PageHeader";
import "./TermsModal.scss";
import {
  TermContent,
  TermsModalProps,
  TermsObject,
  TermsSection,
} from "./TermsModal.types";

const Section = ({ title, content, componentId, altIsOpen }: TermsSection) => {
  const HandlePrivacy = () => {
    return (
      <u
        data-testid="privacy-policy-modal-switch"
        onClick={() => altIsOpen && altIsOpen(true)}
      >
        {i18n.t("privacypolicy.intro.title", {
          ns: "privacypolicy",
        })}
      </u>
    );
  };

  const HandleSupport = () => {
    return (
      <a
        href={SUPPORT_EMAIL}
        className="unstyled-link"
      >
        <u data-testid="support-link-handler">
          {i18n.t("termsofuse.support", {
            ns: "termsofuse",
          })}
        </u>
      </a>
    );
  };

  const FederalDataProtect = () => {
    return (
      <u
        data-testid="support-link-handler"
        onClick={() => openBrowserLink(FEDERAL_DATA_PROTECTION_LINK)}
      >
        {i18n.t("privacypolicy.link.federaldataprotection", {
          ns: "privacypolicy",
        })}
      </u>
    );
  };

  const DataProtectionAuthories = () => {
    return (
      <u
        data-testid="support-link-handler"
        onClick={() => openBrowserLink(DATA_PROTECTION_AUTHORITIES_LINK)}
      >
        {i18n.t("privacypolicy.link.link", { ns: "privacypolicy" })}
      </u>
    );
  };

  return (
    <div>
      {title && (
        <h3
          data-testid={`${componentId}-section-${title
            .replace(/[^aA-zZ]/gim, "")
            .toLowerCase()}`}
        >
          {title}
        </h3>
      )}
      {content.map((item: TermContent, index: number) => (
        <div
          key={index}
          className="terms-of-use-section"
        >
          {!!item.subtitle.length && (
            <>
              <span
                data-testid={`${componentId}-section-${title
                  ?.replace(/[^aA-zZ]/gim, "")
                  .toLowerCase()}-subtitle-${index + 1}`}
              >
                {item.subtitle}
              </span>
              <br />
            </>
          )}
          {!!item.text.length && (
            <>
              <span
                className="terms-of-use-section-bottom"
                data-testid={`${componentId}-section-${title
                  ?.replace(/[^aA-zZ]/gim, "")
                  .toLowerCase()}-content-${index + 1}`}
              >
                <Trans
                  i18nKey={item.text}
                  components={[
                    <HandlePrivacy key="" />,
                    <HandleSupport key="" />,
                    <FederalDataProtect key="" />,
                    <DataProtectionAuthories key="" />,
                  ]}
                />
              </span>
              <br />
            </>
          )}
          {item.nested && item.nested.length > 0 && (
            <ul>
              {item.nested.map((nestedItem, nestedIndex) => (
                <li key={nestedIndex}>
                  <Trans i18nKey={nestedItem} />
                </li>
              ))}
            </ul>
          )}
          {item.nestednumeric && item.nestednumeric.length > 0 && (
            <ul>
              {item.nestednumeric.map((nestedItem, nestedIndex) => (
                <li
                  className="nested-numberic"
                  key={nestedIndex}
                >
                  {nestedItem}
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
};

const TermsModal = ({
  name,
  isOpen,
  setIsOpen,
  altIsOpen,
  children,
}: TermsModalProps) => {
  const nameNoDash = name.replace(/-/g, "");
  const componentId = name + "-modal";
  const termsObject: TermsObject = t(nameNoDash, {
    ns: nameNoDash,
    returnObjects: true,
  });
  const introText = `${i18n.t(`${nameNoDash}.intro.text`, { ns: nameNoDash })}`;
  const sections = termsObject.sections;

  const closeModal = () => setIsOpen(false);

  return (
    <IonModal
      isOpen={isOpen}
      className="terms-modal"
      data-testid={componentId}
      onDidDismiss={closeModal}
    >
      <ScrollablePageLayout
        pageId={componentId + "-content"}
        header={
          <PageHeader
            closeButton={true}
            closeButtonLabel={`${i18n.t(`${nameNoDash}.done`, {
              ns: nameNoDash,
            })}`}
            closeButtonAction={closeModal}
            title={`${i18n.t(`${nameNoDash}.intro.title`, { ns: nameNoDash })}`}
          />
        }
      >
        {!!introText.length && (
          <p>
            <b data-testid={`${componentId}-intro-text`}>{introText}</b>
          </p>
        )}
        {sections.map((section: TermsSection, index: number) => (
          <Section
            key={index}
            title={section.title}
            content={section.content}
            componentId={componentId}
            altIsOpen={altIsOpen}
          />
        ))}
        {children}
      </ScrollablePageLayout>
    </IonModal>
  );
};

export { TermsModal };
