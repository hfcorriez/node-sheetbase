const os = require('os')
const crypto = require('crypto')
const path = require('path')
const fs = require('fs')
const debug = require('debug')('sheetbase/filecache')

class Cache {
  constructor (options) {
    this.options = {
      dir: os.tmpdir(),
      ttl: 60,
      deleteExpired: false,
      ...(options || {})
    }
    debug('init options with', JSON.stringify(this.options))
  }

  static getCache(key) {
    return Cache.defaultInstance().get(key)
  }

  static setCache(key, value, ttl) {
    return Cache.defaultInstance().set(key, value, ttl)
  }

  static delCache(key) {
    return Cache.defaultInstance().del(key)
  }

  static defaultInstance(instance) {
    if (instance instanceof Cache) {
      Cache.instance = instance
    } else if (!Cache.instance) {
      Cache.instance = new Cache()
    }
    return Cache.instance
  }

  hasExpired (key) {
    const raw = this.getRaw(key)
    if (!raw) return true
    return raw.expiredAt < Date.now()
  }

  getRaw (key) {
    const file = this.path(key)
    debug('getRaw', key, file)
    if (!fs.existsSync(file)) return undefined
    try {
      const content = fs.readFileSync(file)
      return JSON.parse(content)
    } catch (err) {
      return null
    }
  }

  get (key, options) {
    options = options || {}
    const file = this.path(key)
    debug('get', key, options, file)

    if (!fs.existsSync(file)) return undefined

    try {
      const data = JSON.parse(fs.readFileSync(file))
      if (data.expiredAt < Date.now()) {
        try {
          if (this.options.deleteExpired) fs.unlinkSync(file)
        } catch (err) {}
        if (!options.returnExpired) return null
      }
      return data.value
    } catch (err) {
      return null
    }
  }

  set (key, value, ttl) {
    const file = this.path(key)
    ttl = typeof ttl === 'number' ? ttl : this.options.ttl

    // cache 365 days when ttl is unlimted
    if (ttl <= 0) ttl = 86400 * 365

    debug('set', key, ttl, file)

    try {
      fs.writeFileSync(
        file,
        JSON.stringify({
          key,
          value,
          expiredAt: Date.now() + ttl * 1000
        })
      )
    } catch (err) {
      return false
    }

    return true
  }

  del(key) {
    const file = this.path(key)
    if (fs.existsSync(file)) {
      fs.unlinkSync(key)
    }
    return true
  }

  path (key) {
    return path.join(
      this.options.dir,
      'filecache_' +
        crypto
          .createHash('sha256')
          .update(key)
          .digest('hex') + '.json'
    )
  }
}

module.exports = Cache
