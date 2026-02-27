const http = require("http");

const options = {
  hostname: "localhost",
  port: 3000,
  path: "/session",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
};

const req = http.request(options, (res) => {
  let data = "";
  res.on("data", (chunk) => {
    data += chunk;
  });
  res.on("end", () => {
    console.log(`Status: ${res.statusCode}`);
    console.log(`Body: ${data}`);
    process.exit(0);
  });
});

req.on("error", (err) => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});

const payload = JSON.stringify({
  email: "test@test.com",
  password: "password123",
});
req.write(payload);
req.end();
