require('dotenv').config();
const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors');
const request = require('supertest');
const CronJob = require('cron').CronJob;

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const authRoute = require('./routes/auth.route');
const scheduleRoute = require('./routes/schedule.route');
const userRoute = require('./routes/user.route');
const { set } = require('mongoose');

const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

// api routes
app.use(cors());
app.use('/api/auth', authRoute);
app.use('/api/schedule', scheduleRoute);
app.use('/api/user', userRoute);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

// const job = new CronJob({
//   cronTime: '0 */28 * * * *', // Chạy Jobs vào mỗi 20 phut
//   onTick: function () {
//     request(app)
//       .get('/api/user/scores')
//       .set('Authorization', 'Bearer vmlyoh51q1cm0vnxqxf2lqtf')
//       .end(function (err, res) {
//         if (err) throw err;
//         console.log(
//           'clone job status: ' +
//             res.status +
//             ' at: ' +
//             new Date().toLocaleTimeString()
//         );
//       });
//   },
//   start: true,
//   timeZone: 'Asia/Ho_Chi_Minh', // Lưu ý set lại time zone cho đúng
// });

// job.start();

module.exports = app;
