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
    try {
      const parsed = JSON.parse(data);
      console.log(`Response: ${JSON.stringify(parsed, null, 2)}`);
    } catch {
      console.log(`Body: ${data}`);
    }
    process.exit(0);
  });
});

req.on("error", (err) => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});

// Use a valid test user from the database
const payload = JSON.stringify({
  email: "lucalupi03@gmail.com",
  password: "password123",
});
req.write(payload);
req.end();
