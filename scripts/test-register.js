const http = require("http");

const options = {
  hostname: "localhost",
  port: 3000,
  path: "/registrazione",
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
    const timestamp = new Date().toISOString().split("T")[1].split(".")[0];
    console.log(
      `Response (${timestamp}): ${data ? data.substring(0, 100) : "empty"}`
    );
    process.exit(0);
  });
});

req.on("error", (err) => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});

// Try registration with new user
const testEmail = `testuser_${Math.random()
  .toString(36)
  .substring(7)}@test.com`;
const payload = JSON.stringify({
  email: testEmail,
  password: "TestPassword123!",
  nome: "Test",
  cognome: "User",
});

console.log(`Testing registration with: ${testEmail}`);
req.write(payload);
req.end();
