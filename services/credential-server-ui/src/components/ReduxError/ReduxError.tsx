import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../store/hooks";
import { triggerToast } from "../../utils/toast";
import { i18n } from "../../i18n";
import {
  clearFetchSchemaDetailError,
  clearFetchSchemaError,
} from "../../store/reducers/schemasSlice";

export const ReduxError = () => {
  const { error, schemaDetailError } = useAppSelector(
    (state) => state.schemasCache
  );
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (error) {
      triggerToast(i18n.t("reduxStoreErrors.fetchSchema"), "error");
      console.error("Error fetching list schema:", error);
      dispatch(clearFetchSchemaError());
    }

    if (schemaDetailError) {
      triggerToast(i18n.t("reduxStoreErrors.fetchSchemaDetail"), "error");
      console.error("Error fetching schema detail:", schemaDetailError);
      dispatch(clearFetchSchemaDetailError());
    }
  }, [dispatch, error, schemaDetailError]);

  return null;
};
