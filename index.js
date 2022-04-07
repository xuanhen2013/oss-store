var fs = require("fs");
var path = require("path");
var Promise = require("bluebird");
var OSS = require("ali-oss");
var utils = require("./utils/joinUrl");
var getHash = require("./utils/getHash");
var moment = require("moment");

var baseStore = require("ghost-storage-base");

class OssStore extends baseStore {
  constructor(config) {
    super(config);
    this.options = config || {};
    this.client = new OSS(this.options);
    this.notfound = config.notfound || null;
  }

  save(file) {
    var origin = this.options.origin;
    var key = this.getFileKey(file);

    return new Promise(function (resolve, reject) {
      return this.client
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
    var client = this.client;

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
    var client = this.client;

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
    return new Promise(function (resolve) {
      try {
        this.client.head(options.path).then(({ meta }) => {
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
