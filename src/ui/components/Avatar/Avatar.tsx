import { IonButton } from "@ionic/react";
import { useAppSelector } from "../../../store/hooks";
import { getIdentifiersCache } from "../../../store/reducers/identifiersCache";
import "./Avatar.scss";
import { AvatarProps, MemberAvatarProps } from "./Avatar.types";

const MemberAvatar = ({
  firstLetter,
  handleClick,
  rank,
}: MemberAvatarProps) => {
  return (
    <IonButton
      shape="round"
      className={"avatar-button" + " rank-" + rank}
      data-testid="avatar-button"
      onClick={handleClick}
    >
      <span>{firstLetter}</span>
    </IonButton>
  );
};

const Avatar = ({ id, handleAvatarClick }: AvatarProps) => {
  const identifiersDataCache = useAppSelector(getIdentifiersCache) || {};
  const getAvatarContent = (id: string) => {
    const cache = identifiersDataCache;
    const entries = Object.entries(cache).sort(
      ([, a], [, b]) =>
        new Date(a.createdAtUTC).getTime() - new Date(b.createdAtUTC).getTime()
    );
    const index = entries.findIndex(([key]) => key === id);
    const item = cache[id];
    const firstLetter = item?.displayName?.charAt(0).toUpperCase() || "";
    const rank = index >= 0 ? index % 5 : 0; // ranks cycle from 0 to 4
    return { firstLetter, rank };
  };

  const { firstLetter, rank } = getAvatarContent(id);

  return (
    <MemberAvatar
      firstLetter={firstLetter}
      rank={rank}
      handleClick={handleAvatarClick}
    />
  );
};

export { Avatar, MemberAvatar };
