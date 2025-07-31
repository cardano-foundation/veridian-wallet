import { useCallback } from "react";
import { Agent } from "../../core/agent/agent";
import { MiscRecordId } from "../../core/agent/agent.types";
import { BasicRecord } from "../../core/agent/records";
import { IdentifierShortDetails } from "../../core/agent/services/identifier.types";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { getIdentifiersCache } from "../../store/reducers/identifiersCache";
import { updateCurrentProfile } from "../../store/reducers/profileCache";
import {
  getCurrentProfile,
  getProfileHistories,
  setProfileHistories,
} from "../../store/reducers/stateCache";

export const useProfile = () => {
  const defaultProfile = useAppSelector(getCurrentProfile);
  const profileHistories = useAppSelector(getProfileHistories);
  const identifierMap = useAppSelector(getIdentifiersCache);
  const dispatch = useAppDispatch();

  const updateProfileHistories = useCallback(
    async (newProfilesHistory: string[]) => {
      await Agent.agent.basicStorage.createOrUpdateBasicRecord(
        new BasicRecord({
          id: MiscRecordId.PROFILE_HISTORIES,
          content: { value: newProfilesHistory },
        })
      );

      dispatch(setProfileHistories(newProfilesHistory));
    },
    [dispatch]
  );

  const updateDefaultProfile = useCallback(
    async (profile: string, newProfilesHistory?: string[]) => {
      await Agent.agent.basicStorage.createOrUpdateBasicRecord(
        new BasicRecord({
          id: MiscRecordId.DEFAULT_PROFILE,
          content: { defaultProfile: profile },
        })
      );

      dispatch(updateCurrentProfile(profile));

      const newHistoriesProfile =
        newProfilesHistory ||
        [...profileHistories, defaultProfile?.identity.id].filter(
          (item) => !!item
        );

      updateProfileHistories(newHistoriesProfile);
    },
    [
      defaultProfile?.identity?.id,
      dispatch,
      profileHistories,
      updateProfileHistories,
    ]
  );

  const clearDefaultProfile = useCallback(async () => {
    await Agent.agent.basicStorage.deleteById(MiscRecordId.DEFAULT_PROFILE);

    dispatch(updateCurrentProfile(""));

    await Agent.agent.basicStorage.deleteById(MiscRecordId.PROFILE_HISTORIES);

    dispatch(setProfileHistories([]));
  }, [dispatch]);

  const getRecentDefaultProfile = useCallback(
    (
      profiles: string[],
      identifierMap: Record<string, IdentifierShortDetails>,
      currentProfileId: string
    ) => {
      const tmpProfileHistories = [...profiles];
      let recentProfile = tmpProfileHistories.pop();

      while (
        recentProfile &&
        !identifierMap[recentProfile] &&
        recentProfile !== currentProfileId &&
        tmpProfileHistories.length > 0
      ) {
        recentProfile = tmpProfileHistories.pop();
      }

      if (recentProfile && !identifierMap[recentProfile]) {
        recentProfile = undefined;
      }

      return {
        recentProfile,
        newProfileHistories: tmpProfileHistories,
      };
    },
    []
  );

  const setRecentProfileAsDefault = useCallback(async () => {
    const { recentProfile, newProfileHistories: tmpProfileHistories } =
      getRecentDefaultProfile(
        profileHistories,
        identifierMap,
        defaultProfile.identity.id
      );

    // Has recent profile (identifier) and it exist on current identifiers
    if (recentProfile && recentProfile !== defaultProfile.identity.id) {
      await updateDefaultProfile(
        recentProfile,
        tmpProfileHistories.filter((item) => identifierMap[item])
      );
      return true;
    }

    const identifiers = Object.values(identifierMap)
      .sort((prev, next) => prev.displayName.localeCompare(next.displayName))
      .filter((item) => item.id !== defaultProfile.identity.id);
    if (identifiers.length > 0) {
      await updateDefaultProfile(identifiers[0].id, []);
      return true;
    }

    await clearDefaultProfile();
    return false;
  }, [
    clearDefaultProfile,
    defaultProfile?.identity?.id,
    getRecentDefaultProfile,
    identifierMap,
    profileHistories,
    updateDefaultProfile,
  ]);

  return {
    defaultName: defaultProfile?.identity?.displayName,
    defaultProfile,
    profileHistories,
    updateDefaultProfile,
    setRecentProfileAsDefault,
    getRecentDefaultProfile,
    updateProfileHistories,
  };
};
