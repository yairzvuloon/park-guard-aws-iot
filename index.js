const { PythonShell } = require("python-shell");
const { DeviceUtil } = require("./src/common/device.utils");
const ShadowUtil = require("./src/common/shadow.utils");
//const exec = util.promisify(require("child_process").exec);
let shell;

const runCarTracker = () => {
  process.chdir("./scripts/park-guard-python");
  shell = PythonShell.run(
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
    (err) => console.log("car_tracker.py failed", { err })
  );
};

const main = async () => {
  const thingName = "ParkGuard1";
  const host = "a2kg0qb424gtrj-ats.iot.eu-west-1.amazonaws.com";

  const device = new DeviceUtil({ thingName, host });

  runCarTracker();
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
