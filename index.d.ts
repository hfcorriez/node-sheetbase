import { drive_v3 } from 'googleapis'
declare namespace Sheetbase {
  type BasicOptions = {
    credentialsFile: string
    tokenFile: string
    spreadsheetId: string
  }
  export type SheetbaseOptions = BasicOptions
  export type DriveOptions = BasicOptions
  export type  SheetOptions = BasicOptions |
  { sheet: string, spreadsheet: Spreadsheet }

  type NumOpts = { [key in '$gt' | '$gte' | '$lt' | '$lte' ]: number }
  type AnyOpts = { [key in '$contains']: any }
  type BoolOpts = { [key in '$empty']: boolean }

  type QueryFilter<T> = {
    [field in keyof Partial<T>]: string | RegExp | NumOpts | AnyOpts | BoolOpts
  }

  type QueryOptions<T> = {
    limit?: number
    skip?: number
    sort?: {
      [field in keyof T]: 1 | -1
    }
  }
  type StrOrNumOpts = { [key in '$inc']: string | number }
  type StrOpts = { [key in '$append' | '$prepend' | '$lowercase' | '$uppercase' ]: string }
  type ObjOpts = { [key in '$replace']: { [k in string]: string }}
  type UpdateOptions<T> = {
    [field in keyof T]: string | number | StrOrNumOpts | StrOpts | ObjOpts
  }

  type HtmlOptions = {
    bodyOnly: boolean;
  }

  export class Drive {
    constructor (options: DriveOptions);
    getFile(): Promise<drive_v3.Schema$File>;
    exportFile(fileId: string): Promise<drive_v3.Schema$File>;
    exportText<T>(fileId: string): Promise<T>;
    exportPdf<T>(fileId: string): Promise<T>;
    exportHtml(fileId: string, options: HtmlOptions): Promise<string>;
  }

  export class Sheet<T> {
    constructor (options: SheetOptions);
      // Create row with JSON data
      create(data: T | T[]): Promise<void>;
      // Create rows with JSON data and matched the query
      update(filter: QueryFilter<T>, update: UpdateOptions<T>): Promise<any>;
      // Delete rows that matched the query
      delete(): Promise<any>;
      find(filter: QueryFilter<T>, options?: QueryOptions<T>): Promise<Array<T>>
      // Get one row data that matched the query
      findOne(filter: QueryFilter<T>, options?: QueryOptions<T>): Promise<T>;
      // Flush full sheet with new JSON data
      flush(data: T | T[]): Promise<void>;
  }


  export type SpreadsheetOptions  = BasicOptions

  type SheetData = {

  }

  type SpreadsheetData = {
    id: string
    url: string
    title: string
    local: string
    timezone: string
    sheets: SheetData[]
  } & FileInfo
  type FileInfo = {}
  type SpreadsheetLoadOpts = {
    noCache?: boolean
  }
  type AddSheetOpts = {
    title: string
  }
  type AddSheetRet = {
    id: number
    title: string
    index: number
    type: string
    rowCount: string
    columnCount: string
  }
  type SheetFilter = {
    sheet: string | number
  }
  type UpdateDataRow<T> = { [key in keyof T]: string } | string[] | { row: number, data: string }
  type UpdateSheetOptions<T> = {
    data: { [key in keyof T]: string } | UpdateDataRow<T>[],
  } & SheetFilter

  type DeleteSheetOptions = { rows: number | number[], columns: number | number[]} & SheetFilter
  type ListSheetOptions = { limit?: number, start?: number, fresh?: boolean } & DeleteSheetOptions

  export class Spreadsheet {
    constructor (options: SpreadsheetOptions);
    // Load full data
    load(options: SpreadsheetLoadOpts): Promise<SpreadsheetData>;
    // Get a sheet
    getSheet(sheet: string | number): SheetData;
    // Add new sheet
    addSheet(options: AddSheetOpts): AddSheetRet; // @fixme
    // Delete a sheet
    deleteSheet(options: SheetFilter): Promise<any>; // @fixme
    // Append row
    append<T>(options: { data: T | T[], sheet: SheetFilter }): Promise<any> // @fixme
    // Update with rows no
    update<T>(options: UpdateSheetOptions<T>): Promise<{ updatedRows: number }> // @fixme
    // Delete rows or columns
    delete(options: DeleteSheetOptions): Promise<any>; // @fixme
    // List sheet data
    list(options: ListSheetOptions): Promise<any>; // @fixme
    // Expand sheet grids
    expand(options: {rows?: any, columns?: any, sheetId?: number}): Promise<any>; // @fixme
  }
}

declare class Sheetbase {
  drive: Sheetbase.Drive;
  constructor (options: Sheetbase.SheetbaseOptions);
  // Load sheets full data
  sheet<T>(sheet: number | string): Sheetbase.Sheet<T>;
  // Switch sheet to control base
  data(): Promise<Sheetbase.SpreadsheetData>;
  // Get spreadsheet file info in Google drive
  file(): Promise<any>;
  sheets(): Promise<any>;
}

export = Sheetbase


