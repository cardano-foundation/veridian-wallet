interface SetupProfileProps {
  userName: string;
  onChangeUserName: (userName: string) => void;
  isGroupProfile?: boolean;
  errorMessage?: string;
  isLoading?: boolean;
}

export type { SetupProfileProps };
