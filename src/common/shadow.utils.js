// const util = require("util");
// const { thingShadow } = require("aws-iot-device-sdk");
// const getCertsData = require("./certs.util");
// const { rejects } = require("assert");
// const { error } = require("console");
// const { compileFunction } = require("vm");
// let opClientToken = null;

// class ShadowUtil {
//   constructor(thingName, clientId, debug) {
//     this._thingName = thingName;
//     this._thingShadow = new thingShadow({
//       ...getCertsData(),
//       host: "a2kg0qb424gtrj-ats.iot.eu-west-1.amazonaws.com",
//       clientId,
//       debug,
//     });

//     this._thingShadow.register(this._thingName, { persistentSubscribe: true });
//   }

//   get thingShadow() {
//     return this._thingShadow;
//   }

//   get thingName() {
//     return this._thingShadow;
//   }

//   async register(option) {
//     return new Promise((resolve, reject) => {
//       this._thingShadow.register(
//         this._thingName,
//         option,
//         (error, failedTopics) => {
//           if (!error && !failedTopics) {
//             resolve(`Device thing: ${this._thingName} registered successfully`);
//           } else {
//             reject(error);
//           }
//         }
//       );
//     });
//   }

//   async getState() {
//     return new Promise((resolve, reject) => {
//       let res;
//       try {
//         res = this._thingShadow.get(this._thingName);
//       } catch (error) {
//         reject(error);
//       }
//       resolve(res);
//     });
//   }

//   async update(stateObject) {
//     return new Promise((resolve, reject) => {
//       let res;
//       try {
//         res = this._thingShadow.update(this._thingName, stateObject);
//       } catch (error) {
//         reject(error);
//       }
//       resolve(res);
//     });
//   }

//   async unregister() {
//     return new Promise((resolve, reject) => {
//       try {
//         this._thingShadow.unregister(this._thingName);
//       } catch (error) {
//         reject(error);
//       }
//       resolve(`Device thing: ${this._thingName} unregistered successfully`);
//     });
//   }

//   addDefaultListeners() {
//     this._thingShadow.on("connect", () => {
//       console.log("connected to AWS IoT...");
//       //
//       // After connecting, wait for a few seconds and then ask for the
//       // current state of the thing shadow.
//       //
//       // setTimeout(() => {
//       //   opClientToken = this._thingShadow.get(this._thingName);
//       //   if (opClientToken === null) {
//       //     console.log("operation in progress");
//       //   }
//       // }, 3000);

//       setTimeout(() => {
//         opClientToken = this._thingShadow.update(this._thingName, {
//           state: {
//             desired: "yair",
//           },
//         });
//         if (opClientToken === null) {
//           console.log("operation in progress");
//         }
//       }, 3000);
//     });

//     this._thingShadow.on("close", () => {
//       console.log("close");
//     });

//     this._thingShadow.on("reconnect", () => {
//       console.log("reconnect/re-register");
//       //
//       // Upon reconnection, re-register our thing shadows.
//       //
//       this._thingShadow.register(this._thingName, {
//         persistentSubscribe: true,
//       });
//       //
//       // After re-registering, wait for a few seconds and then try to update
//       // with our current state
//       //
//       setTimeout(() => {
//         opClientToken = this._thingShadow.update(this._thingName, {
//           state: {
//             desired: "yair",
//           },
//         });
//         if (opClientToken === null) {
//           console.log("operation in progress");
//         }
//       }, 2000);
//     });

//     this._thingShadow.on("offline", () => console.log("offline"));

//     this._thingShadow.on("error", (error) => console.log("error", error));

//     this._thingShadow.on("message", (topic, payload) =>
//       console.log("message", topic, payload.toString())
//     );
//   }

//   addListener(event, listener) {
//     this._thingShadow.addListener(event, listener);
//   }

//   on(event, listener) {
//     this._thingShadow.on(event, listener);
//   }

//   async end() {
//     await this._thingShadow.end();
//   }
// }

// module.exports = ShadowUtil;
