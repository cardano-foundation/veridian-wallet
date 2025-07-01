interface ProfileTypeProps {
  onChangeProfile: (profileType: ProfileType) => void;
  profileType: ProfileType;
}

enum ProfileType {
  Individual = "individual",
  Group = "group",
}

export { ProfileType };
export type { ProfileTypeProps };
