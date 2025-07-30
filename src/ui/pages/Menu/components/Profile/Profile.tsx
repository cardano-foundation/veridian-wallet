import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { IonCard, IonItem } from "@ionic/react";
import { ProfileOptionRef, ProfileProps } from "./Profile.types";
import "./Profile.scss";
import { i18n } from "../../../../../i18n";
import { CustomInput } from "../../../../components/CustomInput";
import { Agent } from "../../../../../core/agent/agent";
import { BasicRecord } from "../../../../../core/agent/records";
import { MiscRecordId } from "../../../../../core/agent/agent.types";
import {
  getAuthentication,
  setAuthentication,
} from "../../../../../store/reducers/stateCache";
import { useAppDispatch, useAppSelector } from "../../../../../store/hooks";
import { showError } from "../../../../utils/error";
import { nameChecker } from "../../../../utils/nameChecker";
import { ErrorMessage } from "../../../../components/ErrorMessage";

const Profile = forwardRef<ProfileOptionRef, ProfileProps>(
  ({ isEditing }, ref) => {
    const dispatch = useAppDispatch();
    const authentication = useAppSelector(getAuthentication);
    const [userName, setUserName] = useState(authentication.userName);

    const errorMessage = nameChecker.getError(userName);

    useEffect(() => {
      setUserName(authentication.userName);
    }, [authentication.userName]);

    const saveChanges = () => {
      if (errorMessage) return;

      userName.length &&
        userName !== authentication.userName &&
        Agent.agent.basicStorage
          .createOrUpdateBasicRecord(
            new BasicRecord({
              id: MiscRecordId.USER_NAME,
              content: {
                userName,
              },
            })
          )
          .then(() => {
            dispatch(
              setAuthentication({
                ...authentication,
                userName,
              })
            );
          })
          .catch((error) => {
            showError("Unable to update user name: ", error, dispatch);
          });
    };

    useImperativeHandle(ref, () => ({
      saveChanges,
    }));

    return (
      <>
        {isEditing ? (
          <div className="edit-name-container">
            <CustomInput
              dataTestId="profile-item-edit-name"
              title={`${i18n.t("tabs.menu.tab.items.profile.name")}`}
              placeholder={userName}
              hiddenInput={false}
              onChangeInput={setUserName}
              value={userName}
              error={!!errorMessage}
            />
            <ErrorMessage message={errorMessage} />
          </div>
        ) : (
          <>
            <div className="profile-item-title-placeholder" />
            <IonCard>
              <IonItem>
                <div
                  className="profile-item"
                  data-testid="profile-item-view-name"
                >
                  <span>{i18n.t("tabs.menu.tab.items.profile.name")}</span>
                  <span>{userName}</span>
                </div>
              </IonItem>
            </IonCard>
          </>
        )}
      </>
    );
  }
);

export { Profile };
