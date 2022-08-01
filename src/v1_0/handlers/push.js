const gcm = require('node-gcm');
const { settings } = require('service-claire/helpers/config');
const logger = require('service-claire/helpers/logger');

const sender = new gcm.Sender(settings.push.apiKey);

module.exports = ({ title, message, data }, registrationTokens = []) => {
  const msg = {
    priority: 'high',
    // We don't want to automatically load any thing
    contentAvailable: false,
    restrictedPackageName: 'io.clarityhub.app',
    data: Object.assign({}, data),
  };

  if (title) {
    msg.data.title = title;
    msg.data.icon = 'drawable';
    msg.data.body = message;
  }

  const pushMessage = new gcm.Message(msg);

  sender.send(pushMessage, { registrationTokens }, (err) => {
    if (err) {
      logger.error(err);
    }
  });
};
