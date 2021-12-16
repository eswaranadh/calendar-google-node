const path = require('path');
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const errorHandler = require('./middleware/error');
const morgan = require('morgan');

// env
dotenv.config({ path: './config/config.env' });

const app = express();

// Body parser
app.use(express.json());

app.use(morgan('dev'));

// Enable CORS
app.use(cors());

const calendarRouter = require("./routes/calendar.routes")

app.use("/api/calendar", calendarRouter)


app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(
  PORT,
  console.log(
    `Server running in ${process.env.NODE_ENV} mode on port ${PORT}`
  )
);

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`.red);
  // Close server & exit process
  // server.close(() => process.exit(1));
});

