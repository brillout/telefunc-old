const puppeteer = require("puppeteer");

module.exports = launchBrowser;

async function launchBrowser() {
  const browser = await puppeteer.launch();

  const page = await browser.newPage();

  // Pipe browser's console
  page.on("console", (message) => {
    const text = message.text();
    const type = message.type();
    if (type === "error") {
      console.error(text);
    } else {
      console.log(text);
    }
  });
  page.on("pageerror", function (err) {
    console.error("[PAGE_ERROR_1]: " + err);
  });
  page.on("error", function (err) {
    console.error("[PAGE_ERROR_2]: " + err);
  });

  let _onHttpRequest;
  page.on("request", async (request) => {
    if (_onHttpRequest) {
      await _onHttpRequest(request);
      request.continue();
    }
  });

  return {
    closeBrowser: async () => {
      await browser.close();
    },
    browserEval,
  };

  var httpPort__current;
  async function browserEval(
    httpPort,
    fn,
    { offlineMode = false, browserArgs, onHttpRequest } = {}
  ) {
    if (httpPort !== httpPort__current) {
      await page.goto("http://localhost:" + httpPort, {
        timeout: 3 * 1000,
        waitUntil: "domcontentloaded",
      });
      httpPort__current = httpPort;
    }

    // https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#requestcontinueoverrides
    _onHttpRequest = onHttpRequest;
    await page.setRequestInterception(!!onHttpRequest);

    await page.setOfflineMode(offlineMode);

    let ret;
    try {
      ret = await page.evaluate(fn, browserArgs);
    } catch (err) {
      // Callstack is now shown in latest puppeteer version, but without the proper line numbers and filenames.
      // Previous bug "Evaluation failed: [object Object]": https://github.com/GoogleChrome/puppeteer/issues/4651
      console.error(err);
      // throw err;
    } finally {
      _onHttpRequest = null;
    }
    return ret;
  }
}

