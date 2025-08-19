enum IdentifierColor {
  One,
  Two,
  Three,
  Four,
  Five,
}

interface IdentifierColorSelectorProps {
  value: IdentifierColor;
  onColorChange: (color: IdentifierColor) => void;
}

export type { IdentifierColorSelectorProps };
export { IdentifierColor };
