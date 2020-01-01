const fs = require('fs')
const { google } = require('googleapis')

class GoogleApi {
  constructor(options) {
    this.options = options
    const auth = this.getAuthClient()
    this.api = {
      spreadsheets: google.sheets({ version: 'v4', auth }).spreadsheets,
      drive: google.drive({version: 'v3', auth})
    }
  }

  /**
   * Call to sheets api
   *
   * @param {String} fn
   * @param {Object} request
   */
  async call (fn, request) {
    const response = await new Promise((resolve, reject) => {
      const parts = fn.split('.')
      let callee = this.api
      let parent = this
      parts.forEach(part => {
        parent = callee
        callee = callee[part]
      })
      callee = callee.bind(parent)

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
