const path = require("path");
const fs = require("fs-extra");
const getCertData = require("./config/certs.util");
const { scriptsNames } = require('./scriptsNames')
const { thingShadow } = require("aws-iot-device-sdk");
const { runCarTracker, killCarTrackerChildProcess, killStreamerChildProcess } = require('./processesHandler');

const CONFIG_FOLDER = path.join(__dirname, '../scripts/park-guard-python/config');
const configNamespace = name => path.join(CONFIG_FOLDER, name);

const LINES_OFFSET_FILE = configNamespace('lines_offset_config.json');
const WHITE_LIST_FILE = configNamespace('white_list.json');

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
        const deviceState = stateObject.state;

        console.log(`Current shadow state status: ${deviceState}`)
      }
    );

    this._thingShadow.on("delta", (thingName, stateObject) => {
      this._stateDelta = stateObject.state;
      const deltaKey = Object.keys(this._stateDelta).pop();

      const delta = this._stateDelta[deltaKey];

      if (deltaKey === 'whiteList')
        this.updateWhiteList(delta)

      else if (deltaKey === 'linesOffset')
        this.updateLinesOffsetConfig(delta)

      else if (deltaKey === 'liveStream')
        this.handleLiveStreamDelta(delta)
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

    fs.writeJsonSync(WHITE_LIST_FILE, whiteListObj);

    this._thingShadow.update(this._thingName, {
      state: {
        reported: this._stateDelta
      }
    });
  }

  updateLinesOffsetConfig(desiredLinesOffsetConfig) {
    killCarTrackerChildProcess();

    const currentConfig = fs.readJSONSync(LINES_OFFSET_FILE);
    fs.writeJsonSync(LINES_OFFSET_FILE, { ...currentConfig, ...desiredLinesOffsetConfig });

    this._thingShadow.update(this._thingName, {
      state: {
        reported: this._stateDelta
      }
    });

    this.handleStreamerState(false);
  }

  restoreDefaultLinesOffsetConfig() {
    const defaultConfig = { horizontal_offset: -50, left_vertical_offset: 0, right_vertical_offset: -30 }

    fs.writeJsonSync(LINES_OFFSET_FILE, defaultConfig);
  }

  handleLiveStreamDelta(liveStreamDelta) {
    if (liveStreamDelta)
      this.handleStreamerState(liveStreamDelta)
    else
      killStreamerChildProcess();

    this._thingShadow.update(this._thingName, {
      state: {
        reported: this._stateDelta
      }
    });
  }

  async main() {
  };

}

module.exports = {
  DeviceUtil,
};
