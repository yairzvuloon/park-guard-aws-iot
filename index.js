const { PythonShell } = require("python-shell");

process.chdir("./scripts/park-guard-python");

let shell = PythonShell.run(
  "car_tracker.py",
  {
    pythonOptions: ["-u"],
    mode: "text",
    args: [
      "-c",
      "./config/config.json",
      "-l",
      "./config/lines_offset_config.json",
    ],
  },
  (err) => console.log(err)
);

shell.on("message", (message) => {
  message.includes("[INFO]") ? null : console.log(message);
});
