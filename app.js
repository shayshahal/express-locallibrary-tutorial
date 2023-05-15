const createError = require('http-errors');
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const helmet = require('helmet');

const compression = require('compression');
const expressLayouts = require('express-ejs-layouts');
const app = express();
// Set up rate limiter: maximum of twenty requests per minute
const RateLimit = require('express-rate-limit');
const limiter = RateLimit({
	windowMs: 1 * 60 * 1000, // 1 minute
	max: 20,
});
// Apply rate limiter to all requests
app.use(limiter);

mongoose.set('strictQuery', false);
const dev_db_url =
	'mongodb+srv://shay:shahal@cluster0.acy88nl.mongodb.net/?retryWrites=true&w=majority';
const mongoDB = process.env.MONGODB_URI || dev_db_url;

main().catch((err) => console.error(err));
async function main() {
	await mongoose.connect(mongoDB);
}
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Add helmet to the middleware chain.
// Set CSP headers to allow our Bootstrap and Jquery to be served
app.use(
	helmet.contentSecurityPolicy({
		directives: {
			'script-src': ["'self'", 'code.jquery.com', 'cdn.jsdelivr.net'],
		},
	})
);
app.use(compression);
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(expressLayouts);

app.use(express.static(path.join(__dirname, 'public')));

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');
const catalogRouter = require('./routes/catalog'); //Import routes for "catalog" area of site

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/catalog', catalogRouter); // Add catalog routes to middleware chain.

// catch 404 and forward to error handler
app.use(function (req, res, next) {
	next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
	// set locals, only providing error in development
	res.locals.title = 'Some error title';
	res.locals.message = err.message;
	res.locals.error = req.app.get('env') === 'development' ? err : {};

	// render the error page
	res.status(err.status || 500);
	res.render('error');
});

module.exports = app;
