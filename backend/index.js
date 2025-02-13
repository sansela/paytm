const express = require("express");
const mongoose = require('mongoose')
const cors = require('cors');
const mainRouter = require("./routes");
const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/v1', mainRouter);

app.listen(3000, async () => {
    await mongoose.connect('mongodb+srv://USERNAME:PASSWORD@cluster0.dhgg4.mongodb.net/paytm?retryWrites=true&w=majority&appName=Cluster0');
    console.log('app started listening on port 3000');
})


