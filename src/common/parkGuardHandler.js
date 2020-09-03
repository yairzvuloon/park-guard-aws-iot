const { PythonShell } = require("python-shell");

let shell;

const { scriptsNames } = require('../config/scriptsNames')

const _getCarTrackerArgs = (scriptName, isStream) => {
  const requiredArgs = [
    "-c",
    "./config/config.json",
    "-l",
    "./config/lines_offset_config.json"
  ]

  if (scriptName === scriptsNames.CAR_TRACKER) return requiredArgs;

  if (scriptName == scriptsNames.STREAMER)
    return [...requiredArgs, "--stream", `${isStream}`]


}

const runCarTracker = (scriptName, isStream) => {
  process.cwd();
  process.chdir("./scripts/park-guard-python");

  shell = PythonShell.run(
    scriptName,
    {
      pythonOptions: ["-u"],
      mode: "text",
      args: _getCarTrackerArgs(scriptName, isStream)
    },
    (err) => err && console.log("the process child failed", { err })
  );

  return shell;
};

const killRunningChildProcess = () => {
  if (shell) {
    process.chdir("../../")
    shell.kill();
  }
}

module.exports = {
  runCarTracker,
  killRunningChildProcess
} 
