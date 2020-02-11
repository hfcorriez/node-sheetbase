const FileCache = require('./filecache')
const debug = require('debug')('SheetsApi/Spreadsheets')

class Spreadsheet {
  constructor (options) {
    this.options = options || {}
    this.api = this.options.api
    this.drive = this.options.drive
    this.cacheKey = this.options.spreadsheetId
    this.data = FileCache.getCache(this.cacheKey)
  }

  /**
   * Get spreadsheet information
   *
   * @param {Object}} options
   */
  async load(options) {
    const {fresh = false} = options || {}

    const file = fresh ? await this.drive.getFile(this.options.spreadsheetId) : null
    let data = this.data
    if (!this.data || file && this.data.modifiedTime !== file.modifiedTime) {
      const result = await this.api.call('spreadsheets.get', {
        spreadsheetId: this.options.spreadsheetId,
        includeGridData: true
      })

      if (!result || !result.sheets) throw new Error('can not get spreadsheet')

      const sheets = result.sheets.map(sheet => {
        const properties = sheet.properties
        const data = sheet.data && sheet.data[0]
        let values = []

        if (data && data.rowData) {
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

      data = {
        id: result.spreadsheetId,
        url: result.spreadsheetUrl,
        title: result.properties.title,
        locale: result.properties.locale,
        timezone: result.properties.timeZone,
        sheets,
        ...file
      }

      FileCache.setCache(this.cacheKey, data, -1)
      this.data = data
    }

    return data
  }

  /**
   * Get sheet information
   *
   * @param {String|Number} id
   */
  async getSheet(id) {
    const spreadsheet = await this.load()
    const selectedSheet = spreadsheet.sheets.find(s => {
      return typeof id === 'number' ? (s.id === id || s.index === id) : (!id ? s.id === 0 : s.title === id)
    })
    return selectedSheet
  }

  async addSheet(options) {
    const {title} = options
    const result = await this.request({requests: [{
      addSheet: {
        properties: {
          title
        }
      }
    }]})

    const properties = result.replies[0].addSheet.properties

    return {
      id: properties.sheetId,
      title: properties.title,
      index: properties.index,
      type: properties.sheetType,
      rowCount: properties.gridProperties.rowCount,
      columnCount: properties.gridProperties.columnCount,
    }
  }

  async getChanges() {
    // const pageToken = await this.api.call('drive.changes.getStartPageToken')
    // const changes = await this.api.call('drive.changes.list', {
    //   pageToken: '882532',
    //   fields: '*'
    // })
    // console.dir(changes, {depth:null})
  }

  async deleteSheet(options) {
    const {sheet} = options
    const selectedSheet = await this.getSheet(sheet)
    if (!selectedSheet) throw new Error('sheet not found')
    return this.request({requests: [{
      deleteSheet: {
        sheetId: selectedSheet.id
      }
    }]})
  }

  /**
   * List spreadsheets
   *
   * @param {Object} options
   */
  async list(options) {
    const {limit = 2000000, start = 1, sheet, fresh = false} = options || {}
    const end = start + limit - 1
    const selectedSheet = await this.getSheet(sheet)
    if (!selectedSheet) throw new Error('sheet not found')

    if (fresh) {
      const sheetTitle = selectedSheet.title
      const result = await this.api.call('spreadsheets.values.get', {
        spreadsheetId: this.options.spreadsheetId,
        range: `'${sheetTitle}'!A${start}:ZZ${end}`
      })
      return result && result.values
    } else {
      return selectedSheet.values.slice(start - 1, end).map(grids => grids.map(grid => grid && grid.text))
    }
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

    const items = typeof data === 'object' && typeof data[0] !== 'object' ? [data] : data
    const values = items.map(item => this.dataToValue(item))

    const result = await this.api.call('spreadsheets.values.append', {
      spreadsheetId: this.options.spreadsheetId,
      range: `'${selectedSheet.title}'!A:ZZ`,
      insertDataOption: 'INSERT_ROWS',
      valueInputOption: 'USER_ENTERED',
      resource: {
        range: `'${selectedSheet.title}'!A:ZZ`,
        majorDimension: 'ROWS',
        values
      }
    })

    const matched = result.updates.updatedRange.match(/^'(\S+)'!([A-Z]+)(\d+):([A-Z]+)(\d+)$/)
    const startRow = parseInt(matched[3])
    const endRow = parseInt(matched[5])
    const columnNo = this.columnLetterToIndex(matched[4])

    /**
     * Fix append not start with column A
     */
    if (matched[2] !== 'A') {
      await this.api.call('spreadsheets.values.batchUpdate', {
        spreadsheetId: this.options.spreadsheetId,
        resource: {
          valueInputOption: 'USER_ENTERED',
          data: [{
            range: `'${selectedSheet.title}'!A${startRow}:ZZ${endRow}`,
            majorDimension: "ROWS",
            values: values.map(value => value.concat(new Array(columnNo - value.length).fill('')))
          }]
        }
      })
    }

    return {
      spreadsheetId: result.updates.spreadsheetId,
      sheet: matched[1],
      startRow,
      endRow,
      insertedRows: result.updates.updatedRows
    }
  }

  /**
   * Update sheet
   *
   * @param {Object} options
   */
  async update(options) {
    const {data: update, sheet, upsert = true} = options || {}
    const result = {updatedRows: 0}
    if (!update) return result
    const selectedSheet = await this.getSheet(sheet)
    if (!selectedSheet) throw new Error('sheet not found')

    const sheetTitle = selectedSheet.title
    const updateRows = !Array.isArray(update) ? Object.keys(update).map(key => ({row: parseInt(key), data: update[key]})) : update

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
    result.updatedRows += data.length

    if (upsert) {
      await this.expand({rows: addRows, columns: addColumns, sheetId: selectedSheet.id})
    }

    await this.api.call('spreadsheets.values.batchUpdate', {
      spreadsheetId: this.options.spreadsheetId,
      resource: {
        valueInputOption: 'USER_ENTERED',
        data
      }
    })

    return result
  }

  /**
   * Support delete data
   *
   * @param {Object} options
   */
  async delete(options) {
    const {rows, columns, sheet} = options || {}
    const selectedSheet = await this.getSheet(sheet)
    if (!selectedSheet) throw new Error('sheet not found')

    const requests = []
    const result = {ok: 1, deletedRowsCount: 0, deleteColumnsCount: 0}
    if (rows && rows.length) {
      const querys = Array.isArray(rows) ? rows.sort((a,b) => b - a).map(row => ({start: row, limit: 1})) : [rows]
      querys.forEach(query => {
        requests.push({
          deleteDimension: {
            range: {
              sheetId: selectedSheet.id,
              dimension: 'ROWS',
              startIndex: query.start - 1,
              endIndex: query.start + (query.limit || 1) - 1
            }
          }
        })
        result.deletedRowsCount += query.limit || 1
      })
    }

    if (columns && columns.length) {
      const querys = Array.isArray(columns) ? columns.map(column => ({start: column, limit: 1})) : [columns]
      querys.forEach(query => {
        requests.push({
          deleteDimension: {
            range: {
              sheetId: selectedSheet.id,
              dimension: 'COLUMNS',
              startIndex: query.start - 1,
              endIndex: query.start + (query.limit || 1) - 1
            }
          }
        })
        result.deletedColumnsCount += query.limit || 1
      })
    }

    if (requests.length) {
      await this.request({requests})
    }

    return result
  }

  /**
   * Request batchUpdate for a spreadsheet
   *
   * @param {Object} options
   */
  request(options) {
    const { requests } = options || {}
    return this.api.call('spreadsheets.batchUpdate', {
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
      else if (typeof key === 'number' || /^[0-9]+$/.test(key)) index = parseInt(key) - 1
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
    return column
  }
}

module.exports = Spreadsheet
