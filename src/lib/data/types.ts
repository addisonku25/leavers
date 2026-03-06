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

export interface DataProvider {
  name: string;
  search(params: MigrationSearchParams): Promise<CareerMigration[]>;
  healthCheck(): Promise<boolean>;
}
