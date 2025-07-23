import { IdentifierColor } from "../IdentifierColorSelector";

interface ThemeItemProps {
  index: number;
  color: number;
}

interface IdentifierThemeSelectorProps {
  color: IdentifierColor;
  selectedTheme: number;
  setSelectedTheme: (value: number) => void;
}

export type { ThemeItemProps, IdentifierThemeSelectorProps };
