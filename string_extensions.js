// Adding in some functionality to the String class
if (!String.prototype.startsWith) {
  Object.defineProperty(String.prototype, 'startsWith', {
    enumerable: false,
    configurable: false,
    writable: false,
    value: function(searchString, position) {
      position = position || 0;
      return this.lastIndexOf(searchString, position) === position;
    }
  });
}

if (!String.prototype.trim) {
  (function() {
    // Make sure we trim BOM and NBSP
    var rtrim = /^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g;
    String.prototype.trim = function() {
      return this.replace(rtrim, '');
    };
  })();
}

// Then adding in a function to Date
if (!Date.now) {
  Date.now = function() {
    return new Date().getTime();
  }
}

if (!Array.prototype.addIfNotPresent) {
  Array.prototype.addIfNotPresent = function(elem) {
    if (_.contains(this, elem)) {
      this.push(elem);
    }
  }
}