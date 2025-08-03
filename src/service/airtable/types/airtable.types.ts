export interface AirtableConfig {
  apiKey: string;
  baseId: string;
  tableName: string;
}

export interface AirtableRecord {
  id: string;
  fields: Record<string, any>;
  createdTime?: string;
}

export interface CreateRecordInput {
  fields: Record<string, any>;
}

export interface CreateRecordResponse {
  success: boolean;
  data?: AirtableRecord;
  error?: string;
}

export interface GetAllRecordsOptions {
  maxRecords?: number;
  view?: string;
  sort?: Array<{ field: string; direction: "asc" | "desc" }>;
  filterByFormula?: string;
}

export interface GetAllRecordsResponse {
  success: boolean;
  data?: AirtableRecord[];
  count?: number;
  error?: string;
}

export interface GetRecordByIdResponse {
  success: boolean;
  data?: AirtableRecord;
  error?: string;
}

export interface SearchOptions {
  filters: Record<string, any>;
  maxRecords?: number;
  view?: string;
}

export interface SearchResponse {
  success: boolean;
  data?: AirtableRecord[];
  count?: number;
  error?: string;
}

export interface UpdateRecordInput {
  id: string;
  fields: Record<string, any>;
}

export interface UpdateRecordResponse {
  success: boolean;
  data?: AirtableRecord;
  error?: string;
}

export interface DeleteRecordResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface BulkDeleteInput {
  ids: string[];
}

export interface BulkDeleteResponse {
  success: boolean;
  deletedCount?: number;
  message?: string;
  error?: string;
}

export interface BulkCreateInput {
  records: CreateRecordInput[];
}

export interface BulkCreateResponse {
  success: boolean;
  data?: AirtableRecord[];
  count?: number;
  error?: string;
}

export interface BulkUpdateInput {
  records: UpdateRecordInput[];
}

export interface BulkUpdateResponse {
  success: boolean;
  data?: AirtableRecord[];
  count?: number;
  error?: string;
}
