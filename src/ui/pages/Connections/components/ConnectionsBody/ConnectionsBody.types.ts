import {
  ConnectionShortDetails,
  RegularConnectionDetails,
} from "../../../../../core/agent/agent.types";
import { MappedConnections } from "../../Connections.types";

interface ConnectionsBodyProps {
  onSearchFocus?: (value: boolean) => void;
  mappedConnections: MappedConnections[];
  handleShowConnectionDetails: (item: RegularConnectionDetails) => void;
  search: string;
  setSearch: (value: string) => void;
}

interface SearchConnectionListProps {
  title: string;
  testId: string;
  connections: RegularConnectionDetails[];
  onItemClick: (item: RegularConnectionDetails) => void;
}

interface SearchConnectionContentProps {
  keyword: string;
  mappedConnections: MappedConnections[];
  onItemClick: (item: RegularConnectionDetails) => void;
}

export type {
  ConnectionsBodyProps,
  SearchConnectionListProps,
  SearchConnectionContentProps,
};
