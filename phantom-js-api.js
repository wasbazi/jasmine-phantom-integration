var system = require('system'),
    fs = require('fs');

if (system.args.length !== 2 && system.args.length !== 3) {
  console.log('Usage: run-jasmine.js URL [xml_file.xml]');
  phantom.exit(1);
}

/**
 * Wait until the test condition is true or a timeout occurs. Useful for waiting
 * on a server response or for a ui change (fadeIn, etc.) to occur.
 *
 * @param testFx javascript condition that evaluates to a boolean,
 * it can be passed in as a string (e.g.: "1 == 1" or "$('#bar').is(':visible')" or
 * as a callback function.
 * @param onReady what to do when testFx condition is fulfilled,
 * it can be passed in as a string (e.g.: "1 == 1" or "$('#bar').is(':visible')" or
 * as a callback function.
 * @param timeOutMillis the max amount of time to wait. If not specified, 3 sec is used.
 */
function waitFor(testFx, onReady, timeOutMillis) {
  var maxtimeOutMillis = timeOutMillis ? timeOutMillis : 3001, //< Default Max Timeout is 3s
      start = new Date().getTime(),
      condition = false,
      interval = setInterval(function() {
        if ((new Date().getTime() - start < maxtimeOutMillis) && !condition) {
          // If not time-out yet and condition not yet fulfilled
          condition = (typeof(testFx) === "string" ? eval(testFx) : testFx()); //< defensive code
        } else {
          if (!condition) {
            // If condition still not fulfilled (timeout but condition is 'false')
            console.log("'waitFor()' timeout");
            console.log("Did you add tests recently? Do they all have values they are testing?");
            console.log("For some reason at least one test may still be pending");
            phantom.exit(1);
          } else {
            // Condition fulfilled (timeout and/or condition is 'true')
            console.log("'waitFor()' finished in " + (new Date().getTime() - start) + "ms.");
            typeof(onReady) === "string" ? eval(onReady) : onReady(); //< Do what it's supposed to do once the condition is fulfilled
            clearInterval(interval); //< Stop this interval
          }
        }
      }, 100); //< repeat check every 100ms
}

var page = require('webpage').create();

// Route "console.log()" calls from within the Page context to the main Phantom context (i.e. current "this")
page.onConsoleMessage = function (msg) {
  console.log(msg);
};

page.open(system.args[1], function (status) {
  if (status !== "success") {
    console.log("Unable to access network");
    phantom.exit();
  } else {
    waitFor(function () {
      return page.evaluate(function () {
          return consoleReporterLite.finished;
        });
    }, function () {
      var exit = page.evaluate(function () {
        return {
          xml: consoleReporterLite.toXML(),
          code: consoleReporterLite.failureCount > 0 ? 1 : 0
        };
      });

      if (system.args[2]) {
        var file = fs.open(system.args[2], "w");
        file.write(exit.xml);
        file.close();
      }

      phantom.exit(exit.code);
    });
  }
});
