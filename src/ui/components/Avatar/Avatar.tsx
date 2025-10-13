import { IonButton } from "@ionic/react";
import { useAppSelector } from "../../../store/hooks";
import "./Avatar.scss";
import { AvatarProps, MemberAvatarProps } from "./Avatar.types";
import { getProfiles } from "../../../store/reducers/profileCache";
import Mary from "../../assets/images/Mary.jpg";
import Oliver from "../../assets/images/Oliver.jpg";

const MemberAvatar = ({
  firstLetter,
  handleClick,
  rank,
  imageSource,
}: MemberAvatarProps) => {
  const finalImageSource =
    imageSource || (rank === 100 ? Mary : rank === 101 ? Oliver : undefined);

  return (
    <IonButton
      shape="round"
      className={`avatar-button rank-${rank}${
        !handleClick ? " no-ripple" : ""
      }${finalImageSource ? " custom-image" : ""}`}
      data-testid="avatar-button"
      onClick={handleClick}
    >
      {finalImageSource ? (
        <img
          src={finalImageSource}
          alt="Avatar"
          className="avatar-image"
        />
      ) : (
        <span>{firstLetter}</span>
      )}
    </IonButton>
  );
};

const Avatar = ({ id, handleAvatarClick }: AvatarProps) => {
  const profiles = useAppSelector(getProfiles) || {};
  const getAvatarContent = (id: string) => {
    if (id === "100") {
      return { firstLetter: "", rank: 100, imageSource: Mary };
    }
    if (id === "101") {
      return { firstLetter: "", rank: 101, imageSource: Oliver };
    }

    const cache = profiles;
    const entries = Object.entries(cache).sort(
      ([, a], [, b]) =>
        new Date(a.identity.createdAtUTC).getTime() -
        new Date(b.identity.createdAtUTC).getTime()
    );
    const index = entries.findIndex(([key]) => key === id);
    const item = cache[id];
    const firstLetter =
      item?.identity.displayName?.charAt(0).toUpperCase() || "";
    const rank = index >= 0 ? index % 5 : 0; // ranks cycle from 0 to 4
    return { firstLetter, rank };
  };

  const { firstLetter, rank, imageSource } = getAvatarContent(id);

  return (
    <MemberAvatar
      firstLetter={firstLetter}
      rank={rank}
      handleClick={handleAvatarClick}
      imageSource={imageSource}
    />
  );
};

export { Avatar, MemberAvatar };
