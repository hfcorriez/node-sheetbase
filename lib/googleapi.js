const fs = require('fs')
const { google } = require('googleapis')
const path = require('path')

// google.options({
//   // All requests made with this object will use these settings unless overridden.
//   timeout: process.env.NODE_ENV !== 'production' ? 15000 : 10000
// })

class GoogleApi {
  constructor (options) {
    this.options = {
      credentialsFile: path.join(__dirname, '../config/google/credentials.json'),
      tokenFile: path.join(__dirname, '../config/google/token.json'),
      ...options
    }

    const auth = this.getAuthClient()
    this.api = {
      spreadsheets: google.sheets({ version: 'v4', auth }).spreadsheets,
      drive: google.drive({ version: 'v3', auth })
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
    credentials = this.options.credentials || JSON.parse(fs.readFileSync(this.options.credentialsFile)).installed
    token = this.options.token || JSON.parse(fs.readFileSync(this.options.tokenFile))
    const { client_secret, client_id } = credentials // eslint-disable-line
    const authClient = new google.auth.OAuth2(client_id, client_secret)
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
