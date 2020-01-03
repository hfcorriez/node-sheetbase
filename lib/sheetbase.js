const Spreadsheet = require('./spreadsheet')
const Sheet = require('./sheet')

/**
 * @summary
 * data internal properties
 * _line Line nu
 */
class Sheetbase {
  constructor (options) {
    this.options = options || {}
    this.spreadsheet = new Spreadsheet(this.options)
  }

  sheet (sheet) {
    return new Sheet({...this.options, sheet, spreadsheet: this.spreadsheet})
  }

  data() {
    return this.spreadsheet.load()
  }

  file() {
    return this.spreadsheet.getFile()
  }

  async sheets() {
    const ret = await this.spreadsheet.get()
    return ret.sheets
  }
}

module.exports = Sheetbase
