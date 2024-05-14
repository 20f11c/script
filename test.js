const Request = require('./lib/Axios');

const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3';

const $ = new Request(userAgent);

(async () => {
  const headers = {
    Accept: 'application/json, text/plain, */*',
  };

  var data = await $.get('http://4.ipw.cn/', headers, true);

  console.log(data);
})();
