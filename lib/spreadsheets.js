const GoogleApi = require('./googleapi')
const debug = require('debug')('SheetsApi/Spreadsheets')

class Spreadsheets {
  constructor (options) {
    this.options = options || {}
    this.api = new GoogleApi(this.options)
  }

  /**
   * Get spreadsheet information
   *
   * @param {Object}} options
   */
  async get(options) {
    const {values} = options || {}

    const result = await this.api.call('get', {
      spreadsheetId: this.options.spreadsheetId,
      includeGridData: !!values
    })

    const sheets = result.sheets.map(sheet => {
      const properties = sheet.properties
      const data = sheet.data && sheet.data[0]
      let values = null

      if (data) {
        values = data.rowData.map(rowData => {
          if (!rowData.values) {
            return []
          }
          const line = rowData.values.map(item => {
            return item.userEnteredValue ? {
              text: item.formattedValue,
              //originalValue: item.userEnteredValue,
              //format: item.effectiveFormat
            } : null
          })
          return line
        })
      }

      return {
        id: properties.sheetId,
        title: properties.title,
        index: properties.index,
        type: properties.sheetType,
        rowCount: properties.gridProperties.rowCount,
        columnCount: properties.gridProperties.columnCount,
        values
      }
    })

    return {
      id: result.spreadsheetId,
      url: result.spreadsheetUrl,
      title: result.properties.title,
      locale: result.properties.locale,
      timezone: result.properties.timeZone,
      sheets,
    }
  }

  /**
   * Get sheet information
   *
   * @param {String|Number} id
   */
  async getSheet(id) {
    id = id || 0
    const spreadsheet = await this.get()
    const selectedSheet = spreadsheet.sheets.find(s => {
      return typeof id === 'number' ? (s.id === id || s.index === id) : s.title === id
    })
    return selectedSheet
  }

  /**
   * List spreadsheets
   *
   * @param {Object} options
   */
  async list(options) {
    const {limit = 2000000, start = 1, sheet = 0} = options || {}
    const selectedSheet = await this.getSheet(sheet)
    if (!selectedSheet) throw new Error('sheet not found')

    const sheetTitle = selectedSheet.title
    const end = start + limit - 1
    const result = await this.api.call('values.get', {
      spreadsheetId: this.options.spreadsheetId,
      range: `'${sheetTitle}'!A${start}:ZZ${end}`
    })
    return result && result.values
  }

  /**
   * Append data to next availabel row
   *
   * @param {Object} options
   */
  async append(options) {
    const {data, sheet} = options || {}
    const selectedSheet = await this.getSheet(sheet)
    if (!selectedSheet) throw new Error('sheet not found')

    const items = typeof data === 'object' || typeof data[0] !== 'object' ? [data] : data
    const values = items.map(item => this.dataToValue(item))

    return this.api.call('values.append', {
      spreadsheetId: this.options.spreadsheetId,
      range: 'A:ZZ',
      insertDataOption: 'INSERT_ROWS',
      valueInputOption: 'RAW',
      resource: {
        range: 'A:ZZ',
        majorDimension: 'ROWS',
        values
      }
    })
  }

  /**
   * Update sheet
   *
   * @param {Object} options
   */
  async update(options) {
    const {data: update, sheet = 0, upsert = true} = options || {}
    const selectedSheet = await this.getSheet(sheet)
    if (!selectedSheet) throw new Error('sheet not found')

    const sheetTitle = selectedSheet.title
    const updateRows = typeof update === 'object' ? Object.keys(update).map(key => ({row: parseInt(key), data: update[key]})) : update

    let addRows = 0
    let addColumns = 0
    const data = updateRows.map(item => {
      if (item.row > selectedSheet.rowCount && item.row - selectedSheet.rowCount > addRows) {
        addRows = item.row - selectedSheet.rowCount
      }
      const value = this.dataToValue(item.data, selectedSheet.columnCount)
      if (value > selectedSheet.columnCount && value - selectedSheet.columnCount > addColumns) {
        addColumns = value - selectedSheet.columnCount
      }

      return {
        range: `'${sheetTitle}'!A${item.row}:ZZ${item.row}`,
        majorDimension: "ROWS",
        values: [ value ]
      }
    })

    if (upsert) {
      await this.expand({rows: addRows, columns: addColumns, sheetId: selectedSheet.id})
    }

    return this.api.call('values.batchUpdate', {
      spreadsheetId: this.options.spreadsheetId,
      resource: {
        valueInputOption: 'RAW',
        data
      }
    })
  }

  /**
   * Request batchUpdate for a spreadsheet
   *
   * @param {Object} options
   */
  request(options) {
    const { requests } = options || {}
    return this.api.call('batchUpdate', {
      spreadsheetId: this.options.spreadsheetId,
      resource: { requests }
    })
  }

  /**
   * Expand the spreadsheet
   *
   * @param {Object} options
   */
  expand(options) {
    const {rows, columns, sheetId} = options || {}
    const requests = []

    if (rows) {
      requests.push({
        appendDimension: {
          sheetId,
          dimension: "ROWS",
          length: rows
        }
      })
    }

    if (columns) {
      requests.push({
        appendDimension: {
          sheetId,
          dimension: "COLUMNS",
          length: columns
        }
      })
    }

    if (requests.length) {
      return this.request({requests})
    }
  }

  /**
   * Convert data to line
   *
   * @example
   *  {A: 'text', B: 'text2'}
   *  ['text', 'text2']
   *  {1: 'text', 2: 'text2'}
   *
   * @param {Object} data
   */
  dataToValue(data) {
    if (Array.isArray(data)) return data
    if (typeof data !== 'object') return []
    const line = []
    Object.keys(data).forEach(key => {
      let index = null
      if (/^[A-Z]+$/.test(key)) index = this.columnLetterToIndex(key) - 1
      else if (/^[0-9]+$/.test(key)) index = parseInt(key) - 1
      if (index === null) return
      line[index] = data[key]
    })

    debug('dataToValue', line)
    return line
  }

  /**
   * Convert column letter to index
   *
   * @param {String} letter
   */
  columnLetterToIndex(letter) {
    let column = 0
    let length = letter.length;
    for (let i = 0; i < length; i++) {
      column += (letter.charCodeAt(i) - 64) * Math.pow(26, length - i - 1)
    }
    return column;
  }
}

module.exports = Spreadsheets
