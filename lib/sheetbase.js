const Spreadsheet = require('./spreadsheet')
const Sheet = require('./sheet')
const Drive = require('./drive')
const GoogleApi = require('./googleapi')

/**
 * @summary
 * data internal properties
 * _line Line nu
 */
class Sheetbase {
  constructor (options) {
    this.options = options || {}
    this.options.api = this.api = new GoogleApi(this.options)
    this.options.drive = this.drive = new Drive(this.options)

    if (this.options.spreadsheetId) {
      this.spreadsheet = this.spreadsheet(this.options.spreadsheetId)
    }
  }

  connect(options) {
    Object.assign(this.options, options || {} )
    if (!this.spreadsheet && this.options.spreadsheetId) {
      this.spreadsheet = new Spreadsheet(this.options)
    }
  }

  info() {
    if (!this.options.spreadsheetId) throw new Error('spreadsheetId is not found')
    return this.drive.getFile(this.options.spreadsheetId)
  }

  sheet (sheet, spreadsheetId) {
    if (!this.spreadsheet && !spreadsheetId) throw new Error('spreadsheet is not found')
    let spreadsheet = this.spreadsheet
    if (spreadsheetId) {
      spreadsheet = this.spreadsheet(spreadsheetId)
    }
    return new Sheet({...this.options, sheet, spreadsheet})
  }

  spreadsheet(id) {
    return new Spreadsheet({...this.options, spreadsheetId: id})
  }
}

module.exports = Sheetbase
