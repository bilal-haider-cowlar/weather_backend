const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();
const router = require("./routes/auth");
const influx_client = require("./config/influxdb").getClient();
app.use(express.json());
app.use(cors());
app.use(router);

const mqtt = require("mqtt");
// const client = mqtt.connect("mqtt://localhost:1883/mqtt");
const client = mqtt.connect("ws://broker.emqx.io:8083/mqtt");

client.on("connect", function () {
  client.subscribe("bilal", function (err) {
    if (!err) {
      console.log("connected mqtt");
    }
  });
});
client.on("message",async function(topic, message) {
  if(topic === "bilal") {
  data=JSON.parse(message.toString())
  console.log("temp"+data.temp)
  console.log("humidity"+data.humidity)
  try {
    await influx_client
      .writePoints([
        {
          measurement: "weather",
          fields: {
            temperature: data.temp,
            humidity: data.humidity
          },
          tags: {
            city: "Islamabad",
          },
        },
      ])
      .then(() => {
        console.log("Data point written successfully");
      })
      .catch((error) => {
        console.error("Error writing data point:", error);
      });
  } catch (err) {
    console.log(err);
  }
  }
  
});

// Testing function fir inserting data in influxdb
// postdata = async () => {
//   try {
//     await influx_client
//       .writePoints([
//         {
//           measurement: "weather",
//           fields: {
//             temperature: 20,
//             humidity: 20
//           },
//           tags: {
//             city: "Islamabad",
//           },
//         },
//       ])
//       .then(() => {
//         console.log("Data point written successfully");
//       })
//       .catch((error) => {
//         console.error("Error writing data point:", error);
//       });
//   } catch (err) {
//     console.log(err);
//   }
// };

const port=process.env.PORT || '7000'
const database_url=process.env.DB || 'mongodb://localhost:27017/weather'

mongoose
  .connect(database_url)
  .then(() => {
    console.log("success");
    app.listen(port);
  })
  .catch(() => {
    console.log("error in connecting db");
  });
