const { thingShadow, device } = require("aws-iot-device-sdk");
const { runCarTracker, killRunningChildProcess } = require('./parkGuardHandler');
const path = require("path");
const fs = require("fs-extra");
const getCertData = require("../config/certs.util");
const { scriptsNames } = require('../config/scriptsNames')


//you need to create certs folder in the project root
//and keep your aws keys in
class DeviceUtil {
  constructor({ thingName, clientId, host }) {
    this._thingName = thingName;
    this._thingShadow = thingShadow({
      ...getCertData(),
      clientId,
      host,
    });



    this._thingShadow.register(this._thingName, { persistentSubscribe: true });

    this._reportsTopic = `${thingName}/reports`;

    this._thingShadow.on(
      "status",
      (thingName, statusType, clientToken, stateObject) => {
        const deviceStateDelta = stateObject.state;
      }
    );

    this._thingShadow.on("delta", (thingName, stateObject) => {
      const stateDelta = stateObject.state;
      const deltaKEy = Object.keys(stateDelta).pop();

      if (deltaKEy === 'whiteList') {
        this.updateWhiteList(stateDelta[deltaKEy])
      }

    });
  }

  sendReport(report) {
    try {
      this._thingShadow.publish(this._reportsTopic, report);
    } catch (error) {
      console.log("DeviceUtil: sendReport failed", error);
    }

    console.log("DeviceUtil: sendReport succeeded");
  }

  handleRunTrackerState() {
    killRunningChildProcess();

    runCarTracker(scriptsNames.CAR_TRACKER, false).on("message", (message) => {
      console.log(message);
      message.includes("[INFO]") ? null : this.sendReport(message);
    });
  }

  handleStreamerState(isVideoStream) {
    killRunningChildProcess();

    runCarTracker(scriptsNames.STREAMER, isVideoStream).on("message", (message) => {
      console.log(message);
      message.includes("[INFO]") ? null : this.sendReport(message);
    });
  }

  updateWhiteList(desiredWhiteList) {
    killRunningChildProcess();

    const whiteListObj = { list: desiredWhiteList.map(licenseNumber => licenseNumber) }

    fs.writeJsonSync(path.join(__dirname, '../../scripts/park-guard-python/config/white_list.json'), whiteListObj);
  }


  async main() {


  };

}

module.exports = {
  DeviceUtil,
};
