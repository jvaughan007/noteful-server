require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');
const { NODE_ENV } = require('./config');
const validateBearerToken = require('./validate-bearer-token');
const errorHandler = require('./error-handler');
const notesRouter = require('./notes/notes-router');
const foldersRouter = require('./folders/folders-router');

const app = express();

app.use(morgan((NODE_ENV === 'production') ? 'tiny' : 'common', {
    skip: () => NODE_ENV === 'test'
}));
app.use(cors());
app.use(helmet());
// app.use(validateBearerToken);

app.use('/api', notesRouter);
app.use('/api', foldersRouter);

app.get('/', (req, res) => {
    res.send('Hello, world!');
});

app.use(errorHandler);

module.exports = app;
