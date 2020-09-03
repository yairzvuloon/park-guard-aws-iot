const { DeviceUtil } = require("./src/common/device.utils");

const main = async () => {
  const thingName = "ParkGuard1";
  const host = "a2kg0qb424gtrj-ats.iot.eu-west-1.amazonaws.com";
  new DeviceUtil({ thingName, host });
};

main();
