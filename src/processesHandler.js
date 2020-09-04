const { PythonShell } = require("python-shell");

let carTrackerProcess, streamerProcess, alarmProcess;

const { scriptsNames } = require('./scriptsNames');

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

  const shell = PythonShell.run(
    scriptName,
    {
      pythonOptions: ["-u"],
      mode: "text",
      args: _getCarTrackerArgs(scriptName, isStream)
    },
    (err) => err && console.log("the process child failed", { err })
  );

  process.chdir("../../")

  if (scriptName === scriptsNames.CAR_TRACKER)
    carTrackerProcess = shell;

  else if (scriptName === scriptsNames.STREAMER)
    streamerProcess = shell

  return shell;
};

const runAlarm = () => {
  process.cwd();
  process.chdir("./scripts/park-guard-python");

  const shell = PythonShell.run(
    scriptsNames.ALARM,
    {
      pythonOptions: ["-u"],
      mode: "text",
      args: []
    },
    (err) => err && console.log("the process child failed", { err })
  );

  process.chdir("../../")

  alarmProcess = shell;

  return shell;
}

const killCarTrackerChildProcess = () => {
  if (carTrackerProcess && carTrackerProcess.childProcess) {
    carTrackerProcess.childProcess.kill();
    carTrackerProcess = null;
  }
}

const killStreamerChildProcess = () => {
  if (streamerProcess && streamerProcess.childProcess) {
    streamerProcess.childProcess.kill();
    streamerProcess = null;
  }
}

const killAlarmChildProcess = () => {
  if (alarmProcess && alarmProcess.childProcess) {
    alarmProcess.childProcess.kill();
    alarmProcess = null;
  }
}

module.exports = {
  runCarTracker,
  runAlarm,
  killCarTrackerChildProcess,
  killStreamerChildProcess,
  killAlarmChildProcess,
} 
