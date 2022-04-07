const fs = require("fs");
const path = require("path");
const Promise = require("bluebird");
const OSS = require("ali-oss");
const utils = require("./utils/joinUrl");
const getHash = require("./utils/getHash");
const moment = require("moment");

const baseStore = require("ghost-storage-base");

class OssStore extends baseStore {
  constructor(config) {
    super(config);
    this.options = config || {};
    this.client = new OSS(this.options);
    this.notfound = config.notfound || null;
  }

  save(file) {
    const origin = this.options.origin;
    const key = this.getFileKey(file);
    const client = this.client;

    return new Promise(function (resolve, reject) {
      return client
        .put(key, fs.createReadStream(file.path))
        .then(function (result) {
          // console.log(result)
          if (origin) {
            resolve(utils.joinUrl(origin, result.name));
          } else {
            resolve(result.url);
          }
        })
        .catch(function (err) {
          // console.log(err)
          reject(false);
        });
    });
  }

  exists(filename) {
    const client = this.client;

    return new Promise(function (resolve, reject) {
      return client
        .head(filename)
        .then(function (result) {
          // console.log(result)
          resolve(true);
        })
        .catch(function (err) {
          // console.log(err)
          reject(false);
        });
    });
  }

  serve(options) {
    return function (req, res, next) {
      next();
    };
  }

  delete(filename) {
    const client = this.client;

    // console.log('del',filename)
    return new Promise(function (resolve, reject) {
      return client
        .delete(filename)
        .then(function (result) {
          // console.log(result)
          resolve(true);
        })
        .catch(function (err) {
          // console.log(err)
          reject(false);
        });
    });
  }

  read() {
    const client = this.client;
    return new Promise(function (resolve) {
      try {
        client.head(options.path).then(({ meta }) => {
          if (meta && meta.path) {
            resolve(meta.path);
          } else {
            resolve(this.notfound);
          }
        });
      } catch (err) {
        console.error(`Read Image Error ${err}`);
        resolve(this.notfound);
      }
    });
  }

  getFileKey(file) {
    const keyOptions = this.options.fileKey;
    let fileKey = null;

    if (keyOptions) {
      const getValue = function (obj) {
        return typeof obj === "function" ? obj() : obj;
      };
      const ext = path.extname(file.name);
      let basename = path.basename(file.name, ext);
      let prefix = "";
      let suffix = "";
      let extname = "";

      if (keyOptions.prefix) {
        prefix = moment()
          .format(getValue(keyOptions.prefix))
          .replace(/^\//, "");
      }

      if (keyOptions.suffix) {
        suffix = getValue(keyOptions.suffix);
      }

      if (keyOptions.extname !== false) {
        extname = ext.toLowerCase();
      }

      const contactKey = function (name) {
        return prefix + name + suffix + extname;
      };

      if (keyOptions.hashAsBasename) {
        return getHash(file).then(function (hash) {
          return contactKey(hash);
        });
      } else if (keyOptions.safeString) {
        basename = security.string.safe(basename);
      }

      fileKey = contactKey(basename);
    }

    return Promise.resolve(fileKey);
  }
}

module.exports = OssStore;
