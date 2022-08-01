const logger = require('service-claire/helpers/logger');

const suggestionCreated = (data, user, chatSubscriptions) => {
  try {
    if (user.accountId === data.meta.accountId) {
      const subscribed = chatSubscriptions.some(uuid => uuid === data.meta.chatUuid);
      const isAUser = user.participantType === 'user';

      if (subscribed && isAUser) {
        return true;
      }
    }
  } catch (err) {
    logger.error(err);
  }

  return false;
};

const suggestionDeleted = (data, user, chatSubscriptions) => {
  try {
    if (user.accountId === data.meta.raw.accountId) {
      const subscribed = chatSubscriptions.some(uuid => uuid === data.meta.clean.chatUuid);
      const isAUser = user.participantType === 'user';

      if (subscribed && isAUser) {
        return true;
      }
    }
  } catch (err) {
    logger.error(err);
  }
};

module.exports = {
  suggestionCreated,
  suggestionDeleted,
};
