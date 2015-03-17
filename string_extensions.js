// Then adding in a function to Date
if (!Date.now) {
  Date.now = function() {
    return new Date().getTime();
  }
}