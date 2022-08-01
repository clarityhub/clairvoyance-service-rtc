const express = require('express');
const bodyParser = require('body-parser');
const limits = require('./rate-limits');
const routes = require('./routes/index');
const http = require('http');

require('./v1_0/subscriptions');
const { settings } = require('service-claire/helpers/config');
const helmet = require('service-claire/middleware/helmet');
const errorHandler = require('service-claire/middleware/errors');
const logger = require('service-claire/helpers/logger');

logger.register('99ed0b5323f3bdd5bd16c991448dbf96');

const app = express();
const h = http.Server(app);

app.enable('trust proxy');
app.use(helmet());
app.use(bodyParser.json());
app.use(limits);
app.use('/rtc', routes(app, h));
app.use(errorHandler);

const server = h.listen(
  settings.port,
  () => logger.log(`✅ 🚟 service-rtc running on port ${settings.port}`)
);

module.exports = { app, server }; // For testing
