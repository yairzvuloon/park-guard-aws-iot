const path = require("path");
const thingConfig = require("../../thing-config.json");
const thing = thingConfig.thing.toLowerCase();

const awsIotKeysPath = path.resolve(`certs/${thing}`);

const privateKey = `${thing}-private.pem.key`;
const certName = `${thing}-certificate.pem.crt`;
const rootCACertName = `${thing}-AmazonRootCA1.pem`;

const getCertsData = () => {
  return {
    keyPath: path.join(awsIotKeysPath, privateKey),
    certPath: path.join(awsIotKeysPath, certName),
    caPath: path.join(awsIotKeysPath, rootCACertName),
  };
};

module.exports = getCertsData;
