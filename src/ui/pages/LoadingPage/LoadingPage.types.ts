enum LoadingType {
  Spin,
  Splash,
}

interface LoadingPageProps {
  type?: LoadingType;
  fullPage?: boolean;
  hideBg?: boolean;
}

export { LoadingType };
export type { LoadingPageProps };
