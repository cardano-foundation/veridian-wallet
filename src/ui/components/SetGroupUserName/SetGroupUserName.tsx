import { useEffect, useState } from "react";
import { Agent } from "../../../core/agent/agent";
import {
  GroupMetadata,
  IdentifierShortDetails,
} from "../../../core/agent/services/identifier.types";
import { i18n } from "../../../i18n";
import { useAppDispatch } from "../../../store/hooks";
import { addOrUpdateProfileIdentity } from "../../../store/reducers/profileCache";
import { DISPLAY_NAME_LENGTH } from "../../globals/constants";
import { ToastMsgType } from "../../globals/types";
import { showError } from "../../utils/error";
import { nameChecker } from "../../utils/nameChecker";
import { MemberAvatar } from "../Avatar";
import { CustomInput } from "../CustomInput";
import { ErrorMessage } from "../ErrorMessage";
import { InfoCard } from "../InfoCard";
import { ScrollablePageLayout } from "../layout/ScrollablePageLayout";
import { PageFooter } from "../PageFooter";
import { PageHeader } from "../PageHeader";
import { Spinner } from "../Spinner";
import { SpinnerConverage } from "../Spinner/Spinner.type";
import "./SetGroupUserName.scss";
import { SetGroupNameProps } from "./SetGroupUserName.types";

const IDENTIFIER_NOT_EXIST = "Identifier not existed. id: ";
const DUPLICATE_NAME = "Identifier name is a duplicate";

const SetGroupUserName = ({ identifier, onClose }: SetGroupNameProps) => {
  const pageId = "set-group-name";
  const dispatch = useAppDispatch();
  const [isLoading, setLoading] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState("");
  const [duplicateName, setDuplicateName] = useState(false);
  const [inputChange, setInputChange] = useState(false);

  const localValidateMessage = inputChange
    ? nameChecker.getError(newDisplayName)
    : undefined;

  const verifyDisplayName =
    newDisplayName.length > 0 && newDisplayName.length <= DISPLAY_NAME_LENGTH;

  useEffect(() => {
    if (!identifier) {
      onClose?.();
    }
  }, [identifier, onClose]);

  const handleSubmit = async () => {
    try {
      setLoading(true);

      if (!identifier) {
        throw new Error(`${IDENTIFIER_NOT_EXIST}`);
      }

      await Agent.agent.identifiers.updateGroupUsername(
        identifier.id,
        newDisplayName
      );

      const newMetaData: GroupMetadata | undefined = identifier.groupMetadata
        ? {
            ...identifier.groupMetadata,
            proposedUsername: newDisplayName,
          }
        : undefined;

      const updatedIdentifier: IdentifierShortDetails = {
        ...identifier,
        groupUsername: newDisplayName,
        groupMetadata: newMetaData,
      };

      dispatch(addOrUpdateProfileIdentity(updatedIdentifier));
      onClose?.(updatedIdentifier);
    } catch (e) {
      if ((e as Error).message === DUPLICATE_NAME) {
        setDuplicateName(true);
        return;
      }

      showError(
        "Unable to edit identifier",
        e,
        dispatch,
        ToastMsgType.GROUP_UPDATED_FAIL
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChangeName = (value: string) => {
    setNewDisplayName(value);
    setInputChange(true);
    setDuplicateName(false);
  };

  const hasError = localValidateMessage || duplicateName;
  const errorMessage =
    localValidateMessage || `${i18n.t("nameerror.duplicatename")}`;

  return (
    <>
      <ScrollablePageLayout
        header={
          <PageHeader
            closeButton={!!onClose}
            closeButtonAction={() => onClose?.()}
            closeButtonLabel={`${i18n.t("setgroup.cancel")}`}
            title={`${i18n.t("setgroup.title")}`}
          />
        }
        activeStatus
        pageId={pageId}
        footer={
          <PageFooter
            pageId={pageId}
            primaryButtonText={`${i18n.t("setgroup.confirm")}`}
            primaryButtonAction={handleSubmit}
            primaryButtonDisabled={!verifyDisplayName}
          />
        }
      >
        <p className="text">{i18n.t("setgroup.text")}</p>
        <div className="group-info">
          <MemberAvatar
            firstLetter={identifier.displayName.at(0)?.toUpperCase() || ""}
            rank={0}
          />
          <p className="group-name">{identifier.displayName}</p>
        </div>
        <div className={`indentifier-input${hasError ? " has-error" : ""}`}>
          <CustomInput
            dataTestId="edit-member-name-input"
            title={`${i18n.t("setgroup.input.label")}`}
            hiddenInput={false}
            autofocus={true}
            onChangeInput={handleChangeName}
            value={newDisplayName}
            placeholder={`${i18n.t("setgroup.input.placeholder")}`}
          />
          {hasError ? (
            <ErrorMessage
              message={errorMessage}
              timeout={false}
            />
          ) : null}
        </div>
        <InfoCard
          warning
          content={i18n.t("setgroup.alert")}
        />
      </ScrollablePageLayout>
      <Spinner
        show={isLoading}
        coverage={SpinnerConverage.Screen}
      />
    </>
  );
};

export { SetGroupUserName };
