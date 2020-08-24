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

    // this._device.subscribe(
    //   `$aws/things/${thingName}/shadow/update/accepted`,
    //   {},
    //   (err, granted) => {
    //     if (err) console.error(err);
    //   }
    // );

    // this._device.subscribe(
    //   `$aws/things/${thingName}/shadow/update/delta`,
    //   {},
    //   (err, granted) => {
    //     if (err) console.error(err);
    //   }
    // );

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

// //device.on("report", function () {
// console.log("report");
// device.subscribe("topic_1");
// try {
//   device.publish(
//     "ParkGuard/1",
//     JSON.stringify({
//       isBlocked: false,
//       license_number: 9650678,
//       picture: "",
//       start_time: "2020-05-30-19-39-07",
//       end_time: "2020-05-30-19-39-14",
//     })
//   );
// } catch (error) {
//   console.log(error);
// }

// console.log("done ");
//});

// device.on("message", function (topic, payload) {
//   console.log("message", topic, payload.toString());
// });
module.exports = {
  DeviceUtil,
};
