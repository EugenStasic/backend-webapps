require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const userRoutes = require('./routes/userRoutes');

const app = express();

// Middleware
app.use(cors({
    origin: 'http://localhost:8080', 
    credentials: true 
}));
app.use(bodyParser.json());
app.use(cookieParser());

//Rute
app.use('/users', userRoutes);

const dbUri = process.env.DATABASE_URL;

//Baza
mongoose
.connect(dbUri, { useNewUrlParser: true, useUnifiedTopology: true, dbName: 'RentABoat' })
.then(() => console.log("Connected to DB"))
.catch((err) => console.log(err));

const port = process.env.PORT;
app.listen(port, () => console.log(`Server is running on port ${port}`));
