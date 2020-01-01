const fs = require('fs')
const { google } = require('googleapis')

class GoogleApi {
  constructor(options) {
    this.options = options
    this.api = google.sheets({ version: 'v4', auth: this.getAuthClient() })
  }

  /**
   * Call to sheets api
   *
   * @param {String} fn
   * @param {Object} request
   */
  async call (fn, request) {
    const response = await new Promise((resolve, reject) => {
      const [namespace, name] = fn.split('.')
      let callee
      if (name) callee = this.api.spreadsheets[namespace][name].bind(this.api.spreadsheets[namespace])
      else callee = this.api.spreadsheets[namespace].bind(this.api.spreadsheets)

      callee(request, (err, ret) => {
        if (err) { return reject(err) }
        return resolve(ret)
      })
    })
    return response && response.data
  }

    /**
   * Get auth client
   */
  getAuthClient () {
    let credentials, token
    try {
      credentials = JSON.parse(fs.readFileSync(this.options.credentialsFile))
      token = JSON.parse(fs.readFileSync(this.options.tokenFile))
    } catch (err) {
      credentials = undefined
    }
    const { client_secret, client_id, redirect_uris } = credentials.installed // eslint-disable-line
    const authClient = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0])
    authClient.setCredentials(token)
    return authClient
  }

  /**
   * Refresh token
   */
  refreshToken () {
    // TODO
  }
}

module.exports = GoogleApi
