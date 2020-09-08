// for debugging
const { DeviceUtil } = require("./src/device.utils");

const main = async () => {
  const thingName = "ParkGuard1";
  const clientId = thingName;
  const host = "a2kg0qb424gtrj-ats.iot.eu-west-1.amazonaws.com";
  new DeviceUtil({ thingName, clientId, host });
};

main();
