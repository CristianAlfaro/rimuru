const express = require('express');
const app = express();
const helmet = require('helmet');

const path = require('path');
const server = require('http').Server(app);
const mongoose = require('mongoose');
const passport = require('passport');
const flash = require('connect-flash');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const session = require('express-session');
const hidePoweredBy = require('hide-powered-by');
const fs = require('fs');
const https = require('https');
const rateLimit     = require("express-rate-limit");
app.use(hidePoweredBy());


const apiLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, //duración de la ventana de tiempo
    max: 100 //peticiones por ip dentro de la ventana de tiempo
});
app.set("trust proxy", true); //para evitar que la ip del proxy se confunda con la del cliente
app.use("/api/", apiLimiter); // solo aplicamos el limite de peticiones a la api



require('./server/config/passport')(passport);


const { url } = require('./server/config/database');

mongoose.connect(url, {
    useMongoClient: true
});

app.set('port', process.env.PORT || 8010);
app.set('views', path.join(__dirname, 'client', 'views'));
app.set('view engine', 'ejs');
//app.disable('x-powered-by');

app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: false}));
app.use(session({
    secret: 'onilink1999',
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(flash());

app.use((req,res,next)=>{
    app.locals.signupMessage=req.flash('signupMessage');
    app.locals.signinMessage=req.flash('signupMessage');
    app.locals.user=req.user;
    next();
})
require('./server/routes/routes')(app, passport);


app.use(express.static(path.join(__dirname,'client', 'public')));
app.use(hidePoweredBy({ setTo: 'PHP 4.2.0' }))

https.createServer({
	key: fs.readFileSync(path.join(__dirname, './keys/server.key')),
	cert: fs.readFileSync(path.join(__dirname, './keys/server.cert')),
	requestCert: true,
	rejectUnauthorized: false,
}, app).listen(app.get('port'), '0.0.0.0',() => {
	console.log(app.get('port'));
});
/*server.listen(app.get('port'), () => {
    console.log('RED SOCIAL corriendo en http://localhost:8010/')
});*/
