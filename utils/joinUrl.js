function joinUrl() {
  var origin = arguments[0];
  var paths = Array.prototype.slice.call(arguments, 1);
  return (
    origin +
    (origin[origin.length - 1] == "/" ? "" : "/") +
    paths
      .map(function (item) {
        return item.replace(/^\//, "").replace(/\/$/, "");
      })
      .join("/")
  );
}

module.exports = {
  joinUrl,
};
