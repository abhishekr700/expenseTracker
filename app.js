const express = require("express");
const bodyParser = require('body-parser');

require("dotenv").config();


const config = require("./configs");

const app = express();

app.use(bodyParser.json());
app.use(express.static('public_html'));

app.use('/', require("./routes"));

app.listen(config.server.port, () => {
    console.log("Server Started");
});
