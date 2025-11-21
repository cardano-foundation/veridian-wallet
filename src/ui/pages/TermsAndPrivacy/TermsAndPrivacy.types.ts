interface TermContent {
  subtitle: string;
  text: string;
  nested?: string[];
  nestednumeric?: string[];
}

interface TermsSection {
  title?: string;
  content: TermContent[];
  componentId: string;
  altIsOpen?: (value: boolean) => void;
}

interface TermsObject {
  done: string;
  intro: {
    title: string;
    text: string;
  };
  sections: TermsSection[];
}

enum PrivacyType {
  Term = "terms-of-use",
  Privacy = "privacy-policy",
}

export type { TermContent, TermsObject, TermsSection };
export { PrivacyType };
