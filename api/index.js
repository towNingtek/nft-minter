let express = require("express");
let engine = require("ejs-locals");
var amqp = require("amqplib/callback_api");
var bodyParser = require("body-parser");
var cors = require("cors");

let app = express();

app.use(cors());
app.use(express.static("public"))
app.use(bodyParser.json());

app.engine("ejs", engine);
app.set("views", "./views");
app.set("view engine", "ejs");

app.get("/", function (req, res) {
   res.render("index", {"title": "首頁",});
})

app.get("/uri/ning",function(req, res){
    var id = req.query.id;
    res.sendFile(__dirname + "/public/URI/" + id + ".json");
})

app.post("/mint",function(req, res){
  // Push to queue
  amqp.connect("amqp://localhost/nft", function(error0, connection) {
  if (error0) {
    throw error0;
  }
  connection.createChannel(function(error1, channel) {
    if (error1) {
      throw error1;
    }
    var queue = "minter";
    var msg = req.body["address"];

    channel.assertQueue(queue, {
      durable: false
    });

    channel.sendToQueue(queue, Buffer.from(msg));
    console.log(" [x] Sent %s", msg);
    });
  });

  res.send({"status":"OK"})
})

let port = 5050;
app.listen(port);
