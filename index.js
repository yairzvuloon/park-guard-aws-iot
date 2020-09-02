const { PythonShell } = require("python-shell");
const { DeviceUtil } = require("./src/common/device.utils");
const ShadowUtil = require("./src/common/shadow.utils");
//const exec = util.promisify(require("child_process").exec);
let shell;
//script:

const scriptsNames = {
  CAR_TRACKER: "car_tracker.py", STREAMER: "streamer.py"
}

const getArgs = (scriptName, isStream) => {
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
  process.chdir("./scripts/park-guard-python");

  shell = PythonShell.run(
    scriptName,
    {
      pythonOptions: ["-u"],
      mode: "text",
      args: getArgs(scriptName, isStream)
    },
    (err) => err && console.log("the process child failed", { err })
  );
};

const main = async () => {
  const thingName = "ParkGuard1";
  const host = "a2kg0qb424gtrj-ats.iot.eu-west-1.amazonaws.com";

  const device = new DeviceUtil({ thingName, host });

  runCarTracker(scriptsNames.STREAMER, false);
  shell.on("message", (message) => {
    console.log(message);
    message.includes("[INFO]") ? null : device.sendReport(message);
  });
  // try {
  //   const shadowUtil = new ShadowUtil("ParkGuard1", "client-1", true);
  //   shadowUtil.addDefaultListeners();
  //   //shadowUtil.on("");
  //   //    shadowUtil.addDefaultListeners();
  //   // shadowUtil.on("message", (topic, payload) =>
  //   //   console.log("message", topic, payload.toString())
  //   // );
  //   // const res = await shadowUtil.register();
  //   // console.log("done", { res });
  //   // const state = await shadowUtil.getState();
  //   // console.log(state);
  //   // await shadowUtil.update({
  //   //   state: {
  //   //     desired: "hello",
  //   //   },
  //   // });
  //   //const updatedState = await shadowUtil.getState();
  //   //  console.log(updatedState);
  //   // console.log(await shadowUtil.getState());
  //   //  }
  //   // const unregisterRes = await shadowUtil.unregister();
  //   // console.log({ unregisterRes });
  // } catch (error) {
  //   console.error(error);
  // }
  //console.log("succeeded");
};

main();
