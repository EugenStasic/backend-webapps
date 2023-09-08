require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const userRoutes = require('./routes/userRoutes');
const boatRoutes = require('./routes/boatRoutes');
const filterRoutes = require('./routes/filterRoutes');
const bookingRoutes = require('./routes/bookingRoutes');

const app = express();

app.use(cors({
    origin: 'https://webapps-rentaboatfront-8665a18bc5ca.herokuapp.com',//'http://localhost:8080'
       credentials: true 
}));
app.use(bodyParser.json());
app.use(cookieParser());

app.use('/users', userRoutes);
app.use('/boats', boatRoutes);
app.use('/search', filterRoutes);
app.use('/bookings', bookingRoutes);

const dbUri = process.env.DATABASE_URL;

mongoose
.connect(dbUri, { useNewUrlParser: true, useUnifiedTopology: true, dbName: 'RentABoat' })
.then(() => console.log("Connected to DB"))
.catch((err) => console.log(err));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server is running on port ${port}`));