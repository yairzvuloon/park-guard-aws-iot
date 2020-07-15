const { spawn } = require("child_process");

ls = spawn("bash", ["./scripts/park-guard-python/run.sh"]);

ls.stdout.on("data", (data) =>
  data.toString().includes("[INFO]")
    ? null
    : console.log("stdout: " + data.toString())
);

// ls.stderr.on("data", (data) => console.log("stderr: " + data.toString()));

ls.on("exit", (code) =>
  console.log("child process exited with code " + code.toString())
);
