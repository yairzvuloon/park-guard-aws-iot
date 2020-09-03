const { thingShadow, device } = require("aws-iot-device-sdk");
const { runCarTracker, killCarTrackerChildProcess, killStreamerChildProcess } = require('./processesHandler');
const path = require("path");
const fs = require("fs-extra");
const getCertData = require("./config/certs.util");
const { scriptsNames } = require('./config/scriptsNames')


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
      this._stateDelta = stateObject.state;
      const deltaKey = Object.keys(this._stateDelta).pop();

      if (deltaKey === 'whiteList')
        this.updateWhiteList(this._stateDelta[deltaKey])

      else if (deltaKey === 'linesOffset')
        this.updateLinesOffsetConfig(this._stateDelta[deltaKey])

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
    killStreamerChildProcess();

    runCarTracker(scriptsNames.CAR_TRACKER, false).on("message", (message) => {
      console.log(message);
      message.includes("[INFO]") ? null : this.sendReport(message);
    });
  }

  handleStreamerState(isVideoStream) {
    killCarTrackerChildProcess();
    killStreamerChildProcess();

    runCarTracker(scriptsNames.STREAMER, isVideoStream).on("message", (message) => {
      console.log(message);
      message.includes("[INFO]") ? null : this.sendReport(message);
    });
  }

  updateWhiteList(desiredWhiteList) {
    killCarTrackerChildProcess();
    killStreamerChildProcess();

    const whiteListObj = { list: desiredWhiteList.map(licenseNumber => licenseNumber) }

    fs.writeJsonSync(path.join(__dirname, '../scripts/park-guard-python/config/white_list.json'), whiteListObj);

    this._thingShadow.update(this._thingName, {
      state: {
        reported: this._stateDelta
      }
    });
  }

  updateLinesOffsetConfig(desiredLinesOffsetConfig) {
    killCarTrackerChildProcess();

    const currentConfig = fs.readJSONSync(path.join(__dirname, '../scripts/park-guard-python/config/lines_offset_config.json'));
    fs.writeJsonSync(path.join(__dirname, '../scripts/park-guard-python/config/lines_offset_config.json'), { ...currentConfig, ...desiredLinesOffsetConfig });

    this._thingShadow.update(this._thingName, {
      state: {
        reported: this._stateDelta
      }
    });

    this.handleStreamerState(false);
  }


  async main() {
    //this.handleRunTrackerState();
  };

}

module.exports = {
  DeviceUtil,
};
