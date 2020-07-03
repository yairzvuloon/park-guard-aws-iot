const awsIot = require("aws-iot-device-sdk");
const path = require("path");

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

device.on("connect", function () {
  console.log("connect");
  device.subscribe("topic_1");
  device.publish("topic_2", JSON.stringify({ test_data: 1 }));
});

device.on("message", function (topic, payload) {
  console.log("message", topic, payload.toString());
});
