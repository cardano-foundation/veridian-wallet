import { useCallback } from "react";
import { Agent } from "../../core/agent/agent";
import { MiscRecordId } from "../../core/agent/agent.types";
import { BasicRecord } from "../../core/agent/records";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import {
  getCurrentProfile,
  getProfiles,
  getRecentProfiles,
  Profile,
  updateCurrentProfile,
  updateRecentProfiles,
} from "../../store/reducers/profileCache";

export const useProfile = () => {
  const defaultProfile = useAppSelector(getCurrentProfile);
  const profileHistories = useAppSelector(getRecentProfiles);
  const profiles = useAppSelector(getProfiles);
  const dispatch = useAppDispatch();

  const updateProfileHistories = useCallback(
    async (newProfilesHistory: string[]) => {
      await Agent.agent.basicStorage.createOrUpdateBasicRecord(
        new BasicRecord({
          id: MiscRecordId.PROFILE_HISTORIES,
          content: { value: newProfilesHistory },
        })
      );

      dispatch(updateRecentProfiles(newProfilesHistory));
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
        [
          ...[...profileHistories].filter(
            (item) => item !== defaultProfile?.identity.id || ""
          ),
          defaultProfile?.identity.id || "",
        ].filter((item) => !!item);

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

    dispatch(updateRecentProfiles([]));
  }, [dispatch]);

  const getRecentDefaultProfile = useCallback(
    (
      profiles: string[],
      identifierMap: Record<string, Profile>,
      currentProfileId?: string
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
        profiles,
        defaultProfile?.identity.id
      );

    // Has recent profile (identifier) and it exist on current identifiers
    if (recentProfile && recentProfile !== defaultProfile?.identity.id) {
      await updateDefaultProfile(
        recentProfile,
        tmpProfileHistories.filter((item) => profiles[item])
      );
      return profiles[recentProfile].identity;
    }

    const identifiers = Object.values(profiles)
      .sort((prev, next) =>
        prev.identity.displayName.localeCompare(next.identity.displayName)
      )
      .filter((item) => item.identity.id !== defaultProfile?.identity.id);
    if (identifiers.length > 0) {
      await updateDefaultProfile(identifiers[0].identity.id, []);
      return identifiers[0].identity;
    }

    await clearDefaultProfile();
    return null;
  }, [
    clearDefaultProfile,
    defaultProfile?.identity?.id,
    getRecentDefaultProfile,
    profiles,
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
