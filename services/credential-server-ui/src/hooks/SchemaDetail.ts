import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchSchemaDetail } from "../store/reducers/schemasSlice";
import { SchemaDetail } from "../store/reducers/schemasSlice.types";

export const useSchemaDetail = (id?: string): SchemaDetail | undefined => {
  const schema = useAppSelector(
    (state) => state.schemasCache.schemaDetailCache[id || ""]
  );
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!schema && id) {
      dispatch(fetchSchemaDetail(id));
    }
  }, [dispatch, schema, id]);

  return schema;
};
