export interface CareerMigration {
  sourceCompany: string;
  sourceRole: string;
  destinationCompany: string;
  destinationRole: string;
  count: number;
}

export interface MigrationSearchParams {
  company: string;
  role: string;
}

export type SearchStatus = "pending" | "complete" | "error";

export interface SearchResult {
  searchId: string;
  migrations: CareerMigration[];
}

export interface LeaverPosition {
  company: string;
  title: string;
  startDate?: string; // ISO date string or partial (e.g. "2024-03")
  endDate?: string; // ISO date string, undefined = current position
}

export interface DetailedLeaver {
  name: string;
  linkedinUrl?: string;
  currentTitle?: string;
  currentCompany?: string;
  transitionDate?: string; // ISO date string
  positions: LeaverPosition[];
  destinationCompany: string; // Maps to migration for FK linkage
  destinationRole: string; // Maps to migration for FK linkage
}

export interface DetailedSearchResult {
  migrations: CareerMigration[];
  leavers: DetailedLeaver[];
}

export interface DataProvider {
  name: string;
  search(params: MigrationSearchParams): Promise<CareerMigration[]>;
  searchDetailed?(params: MigrationSearchParams): Promise<DetailedSearchResult>;
  healthCheck(): Promise<boolean>;
}
