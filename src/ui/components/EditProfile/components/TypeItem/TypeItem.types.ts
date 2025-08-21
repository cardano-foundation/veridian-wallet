interface TypeItemProps {
  dataTestId: string;
  index: number;
  text: string;
  clickEvent: (index: number) => void;
  selectedType: number;
  disabled?: boolean;
}

export type { TypeItemProps };
