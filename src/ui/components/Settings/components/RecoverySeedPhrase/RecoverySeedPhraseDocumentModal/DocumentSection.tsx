import { Trans } from "react-i18next";
import {
  Content,
  DocumentSectionProps,
} from "./RecoverySeedPhraseDocumentModal.types";
import { i18n } from "../../../../../../i18n";

const DocumentSection = ({ sectionKey, image }: DocumentSectionProps) => {
  const title = i18n.t(
    `generateseedphrase.onboarding.recoveryseedphrasedocs.content.${sectionKey}.title`
  );
  const content: Content[] = i18n.t(
    `generateseedphrase.onboarding.recoveryseedphrasedocs.content.${sectionKey}.content`,
    {
      returnObjects: true,
    }
  );

  return (
    <div className="document-section">
      <h2 className="title">{title}</h2>
      {image && (
        <img
          className="image"
          alt={title}
          src={image}
        />
      )}
      {content.map(({ text }, index) => (
        <p
          className="content"
          key={index}
        >
          <Trans>{text}</Trans>
        </p>
      ))}
    </div>
  );
};

export { DocumentSection };
