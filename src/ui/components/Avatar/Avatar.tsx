import { IonButton } from "@ionic/react";
import { useAppSelector } from "../../../store/hooks";
import { getIdentifiersCache } from "../../../store/reducers/identifiersCache";
import "./Avatar.scss";
import { AvatarProps } from "./Avatar.types";

const Avatar = ({ id, handleAvatarClick }: AvatarProps) => {
  const identifiersDataCache = useAppSelector(getIdentifiersCache);
  const getAvatarContent = (id: string) => {
    const entries = Object.entries(identifiersDataCache).sort(
      ([, a], [, b]) =>
        new Date(a.createdAtUTC).getTime() - new Date(b.createdAtUTC).getTime()
    );
    const index = entries.findIndex(([key]) => key === id);
    const item = identifiersDataCache[id];
    const firstLetter = item?.displayName?.charAt(0).toUpperCase() || "";
    const rank = index >= 0 ? index % 5 : 0; // ranks cycle from 0 to 4
    return { firstLetter, rank };
  };

  const { firstLetter, rank } = getAvatarContent(id);

  return (
    <IonButton
      shape="round"
      className={"avatar-button" + " rank-" + rank}
      data-testid="avatar-button"
      onClick={handleAvatarClick}
    >
      <span>{firstLetter}</span>
    </IonButton>
  );
};

export { Avatar };
