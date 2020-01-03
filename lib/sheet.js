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
    return this.valuesToData(values, {startRow: ret.startRow})
  }

  update(query, data, options) {

  }

  delete(query) {

  }

  async find(query, options) {
    const values = await this.spreadsheet.list({sheet: this.options.sheet})
    const data = this.valuesToData(values, options)
    return this.filterData(data, query)
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

  filterData(data, query) {
    const filter = this.buildFilter(query)
    return data.filter(item => this.isMatch(item, filter))
  }

  isMatch(item, filter) {
    return !filter.some(f => {
      const {key, type, value} = f
      const itemValue = item[key]

      switch (type) {
        case 'string':
          return itemValue !== value
        case 'pattern':
          return !value.test(itemValue)
        case 'contains':
          return !itemValue.includes(value)
        case 'gt':
          return parseInt(itemValue) <= value
        case 'lt':
          return parseInt(itemValue) >= value
        case 'gte':
          return parseInt(itemValue) < value
        case 'lte':
          return parseInt(itemValue) > value
        case 'empty':
          return value ? !!itemValue : !itemValue
        default:
          return false
      }
    })
  }

  buildFilter(query) {
    const terms = []
    Object.keys(query).forEach(key => {
      const term = query[key]
      if (typeof term === 'string') {
        if (term.includes('*')) {
          terms.push({
            key,
            type: 'pattern',
            value: new RegExp('^'+term.replace(/\*/g, '(.*?)')+'$')
          })
        } else {
          terms.push({
            key,
            type: 'string',
            value: term
          })
        }
      } else if (term instanceof RegExp) {
        terms.push({
          key,
          type: 'pattern',
          value: term
        })
      } else if (typeof term === 'object') {
        Object.keys(term).forEach(op => {
          const value = term[op]
          switch (op) {
            case '$contains':
              terms.push({
                key,
                type: 'contains',
                value
              })
              break
            case '$gt':
              terms.push({
                key,
                type: 'gt',
                value
              })
              break
            case '$lt':
              terms.push({
                key,
                type: 'lt',
                value
              })
              break
            case '$lte':
              terms.push({
                key,
                type: 'lte',
                value
              })
              break
            case '$gte':
              terms.push({
                key,
                type: 'gte',
                value
              })
              break
            case '$empty':
              terms.push({
                key,
                type: 'empty',
                value
              })
              break
          }
        })
      } else {
        terms.push({
          key,
          type: 'string',
          value: String(value)
        })
      }
    })
    return terms
  }

  valuesToData(values, options) {
    const {startRow, column, lowercase} = options || {}
    const header = values[0].map(v => lowercase && v ? v.toLowerCase() : v)
    const data = []
    values.forEach((value, i) => {
      if (i === 0 || value.join('') === '') return
      const json = {_row: startRow ? startRow + i - 1 : i + 1}
      value.forEach((v, j) => {
        const h = header[j]
        if (!v) return
        if (h) json[h] = v
        if (column) json[this.columnToLetter(j+1)] = v
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
