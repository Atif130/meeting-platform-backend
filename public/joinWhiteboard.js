var request = require("request");
var options = {
  "method": "POST",
  "url": "https://api.netless.link/v5/rooms",
  "headers": {
  "token": "Your SDK Token",
  "Content-Type": "application/json",
  "region": "us-sv"
  },
  body: JSON.stringify({
    "isRecord": false
  })
};
request(options, function (error, response) {
  if (error) throw new Error(error);
  console.log(response.body);
});
