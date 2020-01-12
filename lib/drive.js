const GoogleApi = require('./googleapi')

/**
 * @summary
 * data internal properties
 * _line Line nu
 */
class Drive {
  constructor (options) {
    this.options = options || {}
    this.api = new GoogleApi(this.options)
  }

  getFile (fileId) {
    return this.api.call('drive.files.get', {
      fileId: fileId,
      fields: 'name,kind,mimeType,createdTime,modifiedTime,size'
    })
  }

  async exportHtml(fileId, options) {
    const { bodyOnly = false } = options || {}

    let html = await this.exportFile({fileId, mimeType: 'text/html'})
    html = html.replace(/"https:\/\/www.google.com\/url\?q=(.*?)&amp;sa=.*?"/g, (_, url) => `"${decodeURIComponent(url)}"`)
      .replace(/%7B/g, '{')
      .replace(/%7D/g, '}')

    if (bodyOnly) {
      html = html.match(/<body.*?>(.+)<\/body>/)[1]
    }

    return html
  }

  exportPdf(fileId) {
    return this.exportFile({fileId, mimeType: 'application/pdf'})
  }

  exportText(fileId) {
    return this.exportFile({fileId, mimeType: 'text/plain'})
  }

  exportFile({fileId, mimeType}) {
    return this.api.call('drive.files.export', {
      fileId,
      mimeType
    })
  }
}

module.exports = Drive
