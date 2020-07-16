const awsIot = require("aws-iot-device-sdk");
const path = require("path");

//you need to create certs folder in the project root
//and keep your aws keys in

const awsIotKeysPath = path.resolve("certs/");
const privateKey = "private.pem.key";
const certName = "certificate.pem.crt";
const rootCACertName = "AmazonRootCA1.pem";

const keyPath = path.join(awsIotKeysPath, privateKey);
const certPath = path.join(awsIotKeysPath, certName);
const caPath = path.join(awsIotKeysPath, rootCACertName);

const device = awsIot.device({
  keyPath,
  certPath,
  caPath,
  clientId: "client-1",
  host: "a2kg0qb424gtrj-ats.iot.eu-west-1.amazonaws.com",
});

const sendReport = (report) => {
  try {
    device.publish("ParkGuard/1", report);
  } catch (error) {
    console.log(error);
  }

  console.log("done ");
};

// //device.on("report", function () {
// console.log("report");
// //device.subscribe("topic_1");
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
  sendReport,
};
