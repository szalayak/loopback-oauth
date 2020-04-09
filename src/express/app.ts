import express from 'express';
import { Request, Response } from 'express';
import compression from 'compression'; // compresses requests
import bodyParser from 'body-parser';
import routes from './routes';
import path from 'path';
import cookieParser from 'cookie-parser';
import { auth } from './auth';
import session from 'express-session';
import dotenv from 'dotenv';

// configure environment variables
dotenv.config();

// Create Express server
const app = express();

// Express configuration
app.use(compression());
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(
  session({
    secret: process.env.SESSION_SECRET ?? '',
    resave: false,
    saveUninitialized: false,
  }),
);

// view engine
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Serve static files
app.use('/public', express.static(path.join(__dirname, 'public')));

// Set up authentication
auth(app);

// Set up routes
routes(app);

// hello world site to verify that the server is running
app.get('/hello', (_req: Request, res: Response) => {
  res.send('Hello world!');
});

export default app;
