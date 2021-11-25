const Sheet = require('./sheet')
const Spreadsheet = require('./spreadsheet')

/**
 * @summary
 * data internal properties
 * _line Line nu
 */
class Sheetbase {
  constructor (options) {
    this.options = options || {}
    if (!options.spreadsheetId) throw new Error('spreadsheet is not found')
    this.spreadsheet = new Spreadsheet(options)
  }

  /**
   * Get spreadsheet info
   * @returns
   */
  info() {
    return this.spreadsheet.getFileInfo()
  }

  /**
   * Get sheet
   *
   * @param {Mixed} sheet
   * @returns
   */
  sheet (sheet) {
    let spreadsheet = this.spreadsheet
    return new Sheet({...this.options, sheet, spreadsheet})
  }
}

module.exports = Sheetbase
