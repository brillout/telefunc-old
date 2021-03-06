module.exports = [
  option_shortUrl_1,
  option_shortUrl_2,
  option_serverUrl,
  option_baseUrl,
];

async function option_shortUrl_1({ server, browserEval, httpPort }) {
  let execCount = 0;

  server.testTelefunction__shortUrl = async function (arg) {
    assert(arg === "just some args");
    execCount++;
  };

  await browserEval(
    async () => {
      await window.telefunc.server.testTelefunction__shortUrl("just some args");
    },
    { onHttpRequest }
  );

  assert(execCount === 2, { execCount });

  function onHttpRequest(request) {
    const { _url, _postData } = request;
    assert(
      _url ===
        "http://localhost:" +
          httpPort +
          "/_telefunc/testTelefunction__shortUrl/%5B%22just%20some%20args%22%5D",
      { _url }
    );
    assert(_postData === undefined, { _postData });

    execCount++;
  }
}

async function option_shortUrl_2({ server, browserEval, httpPort }) {
  let telefunctionCalled = false;
  let onHttpRequestCalled = false;

  server.testTelefunction__shortUrl = async function (arg) {
    assert(arg === "just some args");
    telefunctionCalled = true;
  };

  await browserEval(
    async () => {
      assert(window.telefunc.config.shortUrl === false);
      window.telefunc.config.shortUrl = true;
      await window.telefunc.server.testTelefunction__shortUrl("just some args");
      window.telefunc.config.shortUrl = false;
    },
    { onHttpRequest }
  );

  assert(telefunctionCalled && onHttpRequestCalled);

  function onHttpRequest(request) {
    const { _url, _postData } = request;
    assert(
      _url ===
        "http://localhost:" +
          httpPort +
          "/_telefunc/testTelefunction__shortUrl/args-in-body",
      { _url }
    );
    assert(_postData === '["just some args"]', { _postData });

    onHttpRequestCalled = true;
  }
}

async function option_serverUrl({ server, browserEval, httpPort }) {
  let telefunctionCalled = false;
  let onHttpRequestCalled = false;

  server.test_serverUrl = async function () {
    telefunctionCalled = true;
  };

  const wrongHttpPort = 3449;
  assert(httpPort.constructor === Number && httpPort !== wrongHttpPort);
  await browserEval(
    async ({ wrongHttpPort }) => {
      const TelefuncClient = window.__TelefuncClient;
      const telefuncClient = new TelefuncClient();
      telefuncClient.config.serverUrl = "http://localhost:" + wrongHttpPort;
      const server = telefuncClient.telefunctions;
      let failed = false;
      try {
        await server.test_serverUrl();
      } catch (err) {
        failed = true;
      }
      assert(failed === true, { failed });
    },
    { onHttpRequest, browserArgs: { wrongHttpPort } }
  );

  assert(telefunctionCalled === false && onHttpRequestCalled === true, {
    telefunctionCalled,
    onHttpRequestCalled,
  });

  function onHttpRequest(request) {
    assert(
      request._url.startsWith("http://localhost:" + wrongHttpPort),
      request._url
    );
    onHttpRequestCalled = true;
  }
}

async function option_baseUrl({ server, config, browserEval, httpPort }) {
  let telefunctionCalled = false;
  let onHttpRequestCalled = false;

  const baseUrl = (config.baseUrl = "/_api/my_custom_base/");
  server.test_baseUrl = async function () {
    telefunctionCalled = true;
  };

  await browserEval(
    async ({ baseUrl }) => {
      const TelefuncClient = window.__TelefuncClient;
      const telefuncClient = new TelefuncClient();
      telefuncClient.config.baseUrl = baseUrl;
      const server = telefuncClient.telefunctions;
      await server.test_baseUrl();
    },
    { onHttpRequest, browserArgs: { baseUrl } }
  );

  assert(telefunctionCalled === true && onHttpRequestCalled === true, {
    telefunctionCalled,
    onHttpRequestCalled,
  });

  function onHttpRequest(request) {
    const correctUrlBeginning = "http://localhost:" + httpPort + baseUrl;
    const actualUrl = request._url;
    assert(actualUrl.startsWith(correctUrlBeginning), {
      actualUrl,
      correctUrlBeginning,
    });
    onHttpRequestCalled = true;
  }
}
