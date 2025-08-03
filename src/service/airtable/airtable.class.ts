import Airtable from "airtable";
import {
  AirtableConfig,
  AirtableRecord,
  CreateRecordInput,
  CreateRecordResponse,
  GetAllRecordsOptions,
  GetAllRecordsResponse,
  GetRecordByIdResponse,
  SearchOptions,
  SearchResponse,
  UpdateRecordInput,
  UpdateRecordResponse,
  DeleteRecordResponse,
  BulkDeleteInput,
  BulkDeleteResponse,
  BulkCreateInput,
  BulkCreateResponse,
  BulkUpdateInput,
  BulkUpdateResponse,
} from "./types/airtable.types";

export class AirtableManager {
  private base: Airtable.Base;
  private table: Airtable.Table<any>;
  private config: AirtableConfig;

  constructor(apiKey: string, baseId: string, tableName: string) {
    this.config = { apiKey, baseId, tableName };

    // Configure Airtable
    Airtable.configure({
      endpointUrl: "https://api.airtable.com",
      apiKey: this.config.apiKey,
    });

    this.base = Airtable.base(this.config.baseId);
    this.table = this.base(this.config.tableName);
  }

  /**
   * Create a single record
   */
  async create(input: CreateRecordInput): Promise<CreateRecordResponse> {
    try {
      const records = await this.table.create([input]);

      return {
        success: true,
        data: this.formatRecord(records[0]),
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to create record",
      };
    }
  }

  /**
   * Get all records with optional filtering and sorting
   */
  async getAll(
    options: GetAllRecordsOptions = {}
  ): Promise<GetAllRecordsResponse> {
    try {
      const records: AirtableRecord[] = [];
      const selectOptions: any = {
        maxRecords: options.maxRecords || 100,
        view: options.view || "Grid view",
      };

      if (options.sort) {
        selectOptions.sort = options.sort;
      }

      if (options.filterByFormula) {
        selectOptions.filterByFormula = options.filterByFormula;
      }

      await this.table
        .select(selectOptions)
        .eachPage((pageRecords, fetchNextPage) => {
          pageRecords.forEach((record) => {
            records.push(this.formatRecord(record));
          });
          fetchNextPage();
        });

      return {
        success: true,
        data: records,
        count: records.length,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to fetch records",
      };
    }
  }

  /**
   * Get a single record by ID
   */
  async getById(id: string): Promise<GetRecordByIdResponse> {
    try {
      const record = await this.table.find(id);

      return {
        success: true,
        data: this.formatRecord(record),
      };
    } catch (error: any) {
      return {
        success: false,
        error:
          error.statusCode === 404
            ? "Record not found"
            : error.message || "Failed to fetch record",
      };
    }
  }

  /**
   * Search records with filters
   */
  async search(options: SearchOptions): Promise<SearchResponse> {
    try {
      const filterFormula = this.buildFilterFormula(options.filters);

      return await this.getAll({
        filterByFormula: filterFormula,
        maxRecords: options.maxRecords,
        view: options.view,
      });
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Search failed",
      };
    }
  }

  /**
   * Update a single record
   */
  async update(input: UpdateRecordInput): Promise<UpdateRecordResponse> {
    try {
      const records = await this.table.update([
        {
          id: input.id,
          fields: input.fields,
        },
      ]);

      return {
        success: true,
        data: this.formatRecord(records[0]),
      };
    } catch (error: any) {
      return {
        success: false,
        error:
          error.statusCode === 404
            ? "Record not found"
            : error.message || "Failed to update record",
      };
    }
  }

  /**
   * Delete a single record
   */
  async delete(id: string): Promise<DeleteRecordResponse> {
    try {
      await this.table.destroy([id]);

      return {
        success: true,
        message: "Record deleted successfully",
      };
    } catch (error: any) {
      return {
        success: false,
        error:
          error.statusCode === 404
            ? "Record not found"
            : error.message || "Failed to delete record",
      };
    }
  }

  /**
   * Bulk create multiple records
   */
  async bulkCreate(input: BulkCreateInput): Promise<BulkCreateResponse> {
    try {
      const batchSize = 10; // Airtable limit
      const results: AirtableRecord[] = [];

      for (let i = 0; i < input.records.length; i += batchSize) {
        const batch = input.records.slice(i, i + batchSize);
        const records = await this.table.create(batch);
        results.push(...records.map((record) => this.formatRecord(record)));
      }

      return {
        success: true,
        data: results,
        count: results.length,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Bulk create failed",
      };
    }
  }

  /**
   * Bulk update multiple records
   */
  async bulkUpdate(input: BulkUpdateInput): Promise<BulkUpdateResponse> {
    try {
      const batchSize = 10; // Airtable limit
      const results: AirtableRecord[] = [];

      for (let i = 0; i < input.records.length; i += batchSize) {
        const batch = input.records.slice(i, i + batchSize);
        const records = await this.table.update(batch);
        results.push(...records.map((record) => this.formatRecord(record)));
      }

      return {
        success: true,
        data: results,
        count: results.length,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Bulk update failed",
      };
    }
  }

  /**
   * Bulk delete multiple records
   */
  async bulkDelete(input: BulkDeleteInput): Promise<BulkDeleteResponse> {
    try {
      const batchSize = 10; // Airtable limit
      let deletedCount = 0;

      for (let i = 0; i < input.ids.length; i += batchSize) {
        const batch = input.ids.slice(i, i + batchSize);
        await this.table.destroy(batch);
        deletedCount += batch.length;
      }

      return {
        success: true,
        deletedCount,
        message: `${deletedCount} records deleted successfully`,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Bulk delete failed",
      };
    }
  }

  /**
   * Get records with pagination
   */
  async getPaginated(
    pageSize: number = 20,
    offset?: string
  ): Promise<{
    success: boolean;
    data?: AirtableRecord[];
    nextOffset?: string;
    error?: string;
  }> {
    try {
      const records: AirtableRecord[] = [];
      let nextOffset: string | undefined;

      const selectOptions: any = {
        maxRecords: pageSize,
        view: "Grid view",
      };

      if (offset) {
        selectOptions.offset = offset;
      }

      await this.table
        .select(selectOptions)
        .eachPage((pageRecords, fetchNextPage) => {
          pageRecords.forEach((record) => {
            records.push(this.formatRecord(record));
          });

          // Get the offset for next page
          if (pageRecords.length === pageSize) {
            nextOffset = pageRecords[pageRecords.length - 1].id;
          }

          // Don't fetch next page automatically for pagination
          return;
        });

      return {
        success: true,
        data: records,
        nextOffset,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to fetch paginated records",
      };
    }
  }

  /**
   * Count total records
   */
  async count(filterByFormula?: string): Promise<{
    success: boolean;
    count?: number;
    error?: string;
  }> {
    try {
      let count = 0;
      const selectOptions: any = {
        view: "Grid view",
        fields: [], // Only get IDs for counting
      };

      if (filterByFormula) {
        selectOptions.filterByFormula = filterByFormula;
      }

      await this.table
        .select(selectOptions)
        .eachPage((records, fetchNextPage) => {
          count += records.length;
          fetchNextPage();
        });

      return {
        success: true,
        count,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || "Failed to count records",
      };
    }
  }

  /**
   * Check if record exists
   */
  async exists(id: string): Promise<{
    success: boolean;
    exists?: boolean;
    error?: string;
  }> {
    try {
      await this.table.find(id);
      return {
        success: true,
        exists: true,
      };
    } catch (error: any) {
      if (error.statusCode === 404) {
        return {
          success: true,
          exists: false,
        };
      }
      return {
        success: false,
        error: error.message || "Failed to check record existence",
      };
    }
  }

  /**
   * Get table configuration info
   */
  getConfig(): AirtableConfig {
    return { ...this.config };
  }

  /**
   * Switch to a different table in the same base
   */
  switchTable(tableName: string): void {
    this.config.tableName = tableName;
    this.table = this.base(tableName);
  }

  // Private helper methods
  private formatRecord(record: any): AirtableRecord {
    return {
      id: record.id,
      fields: record.fields,
      createdTime: record._rawJson?.createdTime,
    };
  }

  private buildFilterFormula(filters: Record<string, any>): string {
    const conditions: string[] = [];

    Object.entries(filters).forEach(([field, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        if (typeof value === "string") {
          // Use SEARCH for partial string matching
          conditions.push(`SEARCH("${value}", {${field}}) > 0`);
        } else if (typeof value === "number") {
          conditions.push(`{${field}} = ${value}`);
        } else if (typeof value === "boolean") {
          conditions.push(`{${field}} = ${value ? "TRUE()" : "FALSE()"}`);
        } else {
          // For exact matches
          conditions.push(`{${field}} = "${value}"`);
        }
      }
    });

    if (conditions.length === 0) return "";
    if (conditions.length === 1) return conditions[0];
    return `AND(${conditions.join(", ")})`;
  }
}

const airtable = new AirtableManager(
  "your_api_key_here",
  "your_base_id_here",
  "your_table_name_here"
);
