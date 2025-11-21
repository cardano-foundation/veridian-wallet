import { IonLabel, IonSegment, IonSegmentButton } from "@ionic/react";
import { t } from "i18next";
import { useState } from "react";
import { Trans } from "react-i18next";
import { useDispatch } from "react-redux";
import { useHistory } from "react-router-dom";
import { i18n } from "../../../i18n";
import { RoutePath } from "../../../routes";
import { getNextRoute } from "../../../routes/nextRoute";
import { DataProps } from "../../../routes/nextRoute/nextRoute.types";
import { useAppSelector } from "../../../store/hooks";
import { getStateCache } from "../../../store/reducers/stateCache";
import { updateReduxState } from "../../../store/utils";
import { ScrollablePageLayout } from "../../components/layout/ScrollablePageLayout";
import { PageFooter } from "../../components/PageFooter";
import { PageHeader } from "../../components/PageHeader";
import {
  DATA_PROTECTION_AUTHORITIES_LINK,
  FEDERAL_DATA_PROTECTION_LINK,
  SUPPORT_EMAIL,
} from "../../globals/constants";
import { openBrowserLink } from "../../utils/openBrowserLink";
import "./TermsAndPrivacy.scss";
import {
  PrivacyType,
  TermContent,
  TermsObject,
  TermsSection,
} from "./TermsAndPrivacy.types";

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

const TermsAndPrivacy = () => {
  const componentId = "terms-n-privacy";
  const [type, setType] = useState<PrivacyType>(PrivacyType.Term);
  const stateCache = useAppSelector(getStateCache);
  const dispatch = useDispatch();
  const history = useHistory();

  const nameNoDash = type.replace(/-/g, "");
  const termsObject: TermsObject = t(nameNoDash, {
    ns: nameNoDash,
    returnObjects: true,
  });
  const introText = `${i18n.t(`${nameNoDash}.intro.text`, { ns: nameNoDash })}`;
  const sections = termsObject.sections;

  const altIsOpen = () => {
    setType((type) =>
      type === PrivacyType.Term ? PrivacyType.Privacy : PrivacyType.Term
    );
  };

  const handleNavigation = () => {
    const data: DataProps = {
      store: { stateCache },
    };
    const { nextPath, updateRedux } = getNextRoute(
      RoutePath.TERMS_AND_PRIVACY,
      data
    );

    updateReduxState(nextPath.pathname, data, dispatch, updateRedux);

    history.push({
      pathname: nextPath.pathname,
      state: data.state,
    });
  };

  return (
    <ScrollablePageLayout
      pageId={componentId + "-content"}
      header={
        <>
          <PageHeader
            title={`${i18n.t(`${nameNoDash}.intro.title`, { ns: nameNoDash })}`}
          />
          <div className="segment">
            <IonSegment
              data-testid="term-n-privacy-segment"
              className="term-n-privacy-segment"
              value={type}
              onIonChange={(event) =>
                setType(event.detail.value as PrivacyType)
              }
            >
              <IonSegmentButton
                value={PrivacyType.Term}
                data-testid="term-segment-button"
              >
                <IonLabel>{`${i18n.t("termandprivacy.tabs.terms")}`}</IonLabel>
              </IonSegmentButton>
              <IonSegmentButton
                value={PrivacyType.Privacy}
                data-testid="term-segment-button"
              >
                <IonLabel>{`${i18n.t(
                  "termandprivacy.tabs.privacy"
                )}`}</IonLabel>
              </IonSegmentButton>
            </IonSegment>
          </div>
        </>
      }
      footer={
        <PageFooter
          primaryButtonText={`${i18n.t("termandprivacy.button")}`}
          primaryButtonAction={handleNavigation}
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
    </ScrollablePageLayout>
  );
};

export { TermsAndPrivacy };
