class Sheet {
  constructor (options) {
    this.options = options || {}
    this.spreadsheet = this.options.spreadsheet
  }

  flush(data) {

  }

  async create(data) {
    const header = await this.getHeader()
    const addHeaders = []
    const values = []
    data = Array.isArray(data) ? data : [data]

    data.forEach(item => {
      const value = new Array()
      Object.keys(item).forEach(key => {
        let index = header.indexOf(key)
        if (index === -1) {
          addHeaders.push(key)
          index = header.push(key) - 1
        }
        value[index] = item[key]
      })
      values.push(value)
    })

    if (addHeaders.length) {
      await this.updateHeader(header)
    }

    const ret = await this.spreadsheet.append({data: values})
    values.unshift(header)
    return this.valuesToData(values, ret.startRow)
  }

  update(query, data, options) {

  }

  delete(query) {

  }

  async find(query) {
    const values = await this.spreadsheet.list({sheet: this.options.sheet})
    return this.valuesToData(values)
  }

  async getHeader() {
    const values = await this.spreadsheet.list({sheet: this.options.sheet, limit:1})
    return values[0]
  }

  async updateHeader(header) {
    return this.spreadsheet.update({data:{1: header}, sheet: this.options.sheet})
  }

  findOne(query) {

  }

  valuesToData(values, startRow) {
    const header = values[0]
    const data = []
    values.forEach((value, i) => {
      if (i === 0 || value.join('') === '') return
      const json = {_row: startRow ? startRow + i - 1 : i + 1}
      value.forEach((v, j) => {
        const h = header[j]
        if (!v) return
        if (h) json[h] = v
        json[this.columnToLetter(j+1)] = v
      })
      data.push(json)
    })
    return data
  }

  columnToLetter(column){
    let temp, letter = ''
    while (column > 0) {
      temp = (column - 1) % 26
      letter = String.fromCharCode(temp + 65) + letter
      column = (column - temp - 1) / 26
    }
    return letter
  }
}

module.exports = Sheet
