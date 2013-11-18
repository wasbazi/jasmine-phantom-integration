// inspiration taken from jasmine/src/console/ConsoleReporter.js

getJasmineRequireObj().ConsoleReporterLite = function() {

  function ConsoleReporterLite() {
    var specCount,
      failureCount,
      failedSpecs = [],
      pendingCount,
      hasFinished,
      ansi = {
        green: '\033[32m',
        red: '\033[31m',
        yellow: '\033[33m',
        none: '\033[0m'
      };

    this.started = false;
    this.finished = false;

    this.jasmineStarted = function() {
      this.started = true;

      specCount = 0;
      failureCount = 0;
      pendingCount = 0;
      printNewline();
      print("Started");
    };

    this.jasmineDone = function() {
      this.finished = true;
      this.failureCount = failureCount;

      print("Results:");

      for (var i = 0; i < failedSpecs.length; i++) {
        specFailureDetails(failedSpecs[i]);
      }

      var specCounts = specCount + " " + plural("spec", specCount) + ", " +
        failureCount + " " + plural("failure", failureCount);

      if (pendingCount) {
        specCounts += ", " + pendingCount + " pending " + plural("spec", pendingCount);
      }

      print(colored(failureCount > 0 ? 'red' : 'green', specCounts));
    };

    this.specDone = function(result) {
      specCount++;

      if (result.status == "pending") {
        pendingCount++;
        return;
      }

      if (result.status == "failed") {
        failureCount++;
        failedSpecs.push(result);
      }
    };

    this.toXML = function(){
      if(this.finished){
        var topSuite = jasmine.getEnv().topSuite;
        return this.reportResults(topSuite);
      }
    };

    this.reportSpecResults = function(spec) {
      if (!spec) {
        return '';
      }

      var results = spec.result;
      spec.didFail = !(spec.status() === "passed");
      spec.output = '<testcase classname="' + spec.getFullName() +
          '" name="' + escapeInvalidXmlChars(spec.description) + '">';
      if(results.skipped) {
        spec.output = spec.output + "<skipped />";
      }

      var failure = "";
      var failures = 0;
      var resultItems = results.failedExpectations;
      for (var i = 0; i < resultItems.length; i++) {
        var result = resultItems[i];

        if (result.expected && !result.passed) {
          failures += 1;
          failure += '<failure type="' + result.matcherName + '" message="' + trim(escapeInvalidXmlChars(result.message)) + '">';
          failure += escapeInvalidXmlChars(result.stack || result.message);
          failure += "</failure>";
        }
      }
      if (failure) {
        spec.output += failure;
      }
      spec.output += "</testcase>";

      return spec.output;
    };

    this.reportSuiteResults = function(suite) {
      if (!suite) {
        return '';
      }
      suite.specs.forEach(this.reportSpecResults);

      var specs = suite.specs;
      var specOutput = "";
      // for JUnit results, let's only include directly failed tests (not nested suites')
      var failedCount = 0;

      for (var i = 0; i < specs.length; i++) {
        failedCount += specs[i].didFail ? 1 : 0;
        specOutput += "\n  " + specs[i].output;
      }

      suite.output = '\n<testsuite name="' + suite.getFullName() +
          '" errors="0" tests="' + specs.length + '" failures="' + failedCount + '">';

      suite.output += specOutput;
      suite.output += "\n</testsuite>";

      return suite.output + (suite.suites || []).map(this.reportSuiteResults.bind(this)).join("");
    };

    this.reportResults = function(reporter) {
      var output = '<?xml version="1.0" encoding="UTF-8" ?>';
      var suites = reporter.suites;
      output += "\n<testsuites>";

      for (var i = 0; i < suites.length; i++) {
        var suite = suites[i];
        output += (suite.specs || []).map(this.reportSpecResults, this).join("");
        output += (suite.suites || []).map(this.reportSuiteResults, this).join("");
      }

      output += "\n</testsuites>";
      return output;
    };

    return this;

    function print(out){
      console.log(out);
    }

    function printNewline() {
      print("\n");
    }

    function colored(color, str) {
      return ansi[color] + str + ansi.none;
    }

    function plural(str, count) {
      return count == 1 ? str : str + "s";
    }

    function repeat(thing, times) {
      var arr = [];
      for (var i = 0; i < times; i++) {
        arr.push(thing);
      }
      return arr.join("");
    }

    function indent(str, spaces) {
      var lines = (str || '').split("\n");
      var newArr = [];
      for (var i = 0; i < lines.length; i++) {
        newArr.push(repeat(" ", spaces) + lines[i]);
      }
      return newArr.join("\n");
    }

    function specFailureDetails(result) {
      print(colored('red', result.fullName));
      printNewline();
    }

    function ISODateString(d) {
      function pad(n) { return n < 10 ? '0' + n : n; }

      return d.getFullYear() + '-' +
          pad(d.getMonth() + 1) + '-' +
          pad(d.getDate()) + 'T' +
          pad(d.getHours()) + ':' +
          pad(d.getMinutes()) + ':' +
          pad(d.getSeconds());
    }

    function trim(str) {
      return str.replace(/^\s+/, "").replace(/\s+$/, "");
    }

    function escapeInvalidXmlChars(str) {
      return str.replace(/\&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/\>/g, "&gt;")
          .replace(/\"/g, "&quot;")
          .replace(/\'/g, "&apos;");
    }
  }

  return ConsoleReporterLite;
};
