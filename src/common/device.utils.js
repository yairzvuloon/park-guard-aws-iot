const { thingShadow, device } = require("aws-iot-device-sdk");
const { S3 } = require("aws-sdk");
const path = require("path");
const fs = require("fs/promises");
const getCertData = require("./certs.util");

//you need to create certs folder in the project root
//and keep your aws keys in
class DeviceUtil {
  constructor({ thingName, clientId, host }) {
    this._thingName = thingName;
    this._device = device({
      ...getCertData(),
      clientId,
      host,
    });

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
        const deviceControlState = stateObject.state.desired;
      }
    );

    this._thingShadow.on("delta", (thingName, stateObject) => {
      const deviceControlState = stateObject.state.desired;
    });

    this._thingShadow.on("connect", () => {
      console.log("connect");
      setTimeout(() => {
        const clientToken = this._thingShadow.get(this._thingName);
        if (clientToken) console.log("shadow connected");
      }, 3000);
    });

    // this._device.publish(
    //   `$aws/things/${thingName}/shadow/update`,
    //   JSON.stringify({
    //     state: {
    //       reported: {
    //         isAllowed: true,
    //       },
    //     },
    //   }),
    //   (err, granted) => {
    //     if (err) console.error(err);
    //   }
    // );

    // this._device.on("message", (topic, payload) =>
    //   console.log("message", topic, payload.toString())
    // );
  }

  sendReport(report) {
    try {
      this._thingShadow.publish(this._reportsTopic, report);
    } catch (error) {
      console.log("DeviceUtil: sendReport failed", error);
    }

    console.log("DeviceUtil: sendReport succeeded");
  }
}

module.exports = {
  DeviceUtil,
};
