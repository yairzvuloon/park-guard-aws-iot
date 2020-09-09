// for debugging
const { DeviceUtil } = require("./src/device.utils");
const thingConfig = require("./thing-config.json");

const main = async () => {
  const thingName = thingConfig.thing;
  const clientId = thingName;
  const host = "a2kg0qb424gtrj-ats.iot.eu-west-1.amazonaws.com";
  new DeviceUtil({ thingName, clientId, host });
};

main();
