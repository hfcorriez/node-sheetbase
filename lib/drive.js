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

  exportHtml(fileId) {
    return this.exportFile({fileId, mimeType: 'text/html'})
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
