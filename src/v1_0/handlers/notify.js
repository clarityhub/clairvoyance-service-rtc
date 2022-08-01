const redis = require('service-claire/services/redis');
const call = require('service-claire/rpc/call');
const emailMiddleware = require('service-claire/middleware/email');
const { MESSAGE_CREATED, NOTIFICATION_DELETED } = require('service-claire/events');
const logger = require('service-claire/helpers/logger');

const hash = require('object-hash');
const { accountOnline, userOnline } = require('./onlineStatus');
const pushNotification = require('./push');

const {
  Notification,
  RegistrationToken,
} = require('../../models');

const setnxPromise = (...args) => {
  return new Promise((resolve, reject) => {
    redis.setnx(...args, (err, res) => {
      if (err) {
        reject(err);
      }
      resolve(res);
    });
  });
};

/**
 * Add notifications to the database
 *
 * @private
 */
const createPersistentNotifications = (accountId, userIds, data) => {
  return Notification.bulkCreate(userIds.map((uid) => {
    return {
      accountId,
      userId: uid,
      eventHash: hash({
        userId: uid,
        data,
      }),
      eventType: 'message',
      eventRaw: data.meta.raw,
      eventClean: data.meta.clean,
    };
  })).catch((err) => {
    logger.error(err);
  });
};

/**
 * Send out the data to all listed users. Determine the
 * devices to send push notifications to.
 *
 * @private
 */
const sendNotifications = (accountId, users, {
  title,
  template,
  data,
}, { email, push }) => {
  const req = {};
  emailMiddleware(req, null, () => { });

  users.forEach((user) => {
    // check registered push devices
    if (push) {
      RegistrationToken.findAll({
        where: {
          accountId,
          userId: user.id,
        },
      }).then(async (tokens) => {
        try {
          const userHasPushDevice = tokens.length > 0;
          const isNotOnlineInWebapp = !await userOnline(
            accountId,
            user.uuid,
            'webapp'
          );

          if (userHasPushDevice && isNotOnlineInWebapp) {
            const numberOfNotifications = await Notification.count({
              where: {
                accountId,
                userId: {
                  $or: [-1, user.id],
                },
              },
            });

            // send push notifications to all devices
            pushNotification({
              title,
              message: data.message,
              data: Object.assign({}, data, {
                badge: numberOfNotifications,
              }),
            }, tokens.map(t => t.registrationToken));
          }
        } catch (err) {
          logger.error(err);
        }
      }).catch((err) => {
        logger.error(err);
      });
    }

    if (email) {
      req.services.email.send({
        to: user.email,
        subject: title,
        template,
        data: data || {},
      });
    }
  });
};

/**
 * When a new chat is created, we notify the entire account
 * that a new chat has been created. We create a persistent
 * notification, send emails, and send push notifications.
 *
 * @private
 */
const handleNewChat = async (accountId, chatId, data) => {
  try {
    const message = data.meta.raw.text;
    // don't send notifications for this room after
    // the initial send (since new messages would cause a new email)
    const key = `rtc:notify:${accountId}:${chatId}`;
    const didSet = await setnxPromise(key, +new Date());

    if (didSet === 1) {
      // It's a new chat
      // NOTE We await purpose so that when we get the count of
      // notifications later, it is always correct.
      await createPersistentNotifications(
        accountId,
        [-1],
        data
      );

      const isAccountOnline = await accountOnline(accountId);

      const c = await call;
      const accountUsers = await c('getUsers', {
        meta: { accountId },
      });
      // Send emails and stuff
      sendNotifications(accountId, accountUsers, {
        title: 'You\'ve got a new chat',
        template: 'new-chat',
        data: {
          chatUuid: data.meta.raw.Chat.uuid,
          message,
        },
      }, {
        email: !isAccountOnline,
        push: true,
      });
    }
  } catch (err) {
    logger.error(err);
  }
};

/**
 * When a new message is created, we need to create a persistent
 * notification and send out pushes to any devices that need
 * the message
 *
 * @private
 */
const handleNewMessage = async (accountId, users, data) => {
  try {
    const message = data.meta.raw.text;
    const userIds = users.map(u => u.realId);
    const c = await call;

    const fullUsers = await Promise.all(userIds.map((userId) => {
      return c('getUser', {
        meta: { userId },
      });
    }));

    createPersistentNotifications(
      accountId,
      fullUsers.map(u => u.id),
      data
    );

    // Send emails and stuff
    sendNotifications(accountId, fullUsers, {
      title: 'New Message',
      data: {
        chatUuid: data.meta.raw.Chat.uuid,
        message,
      },
    }, {
      push: true,
    });
  } catch (err) {
    logger.error(err);
  }
};

/**
 * When a notification is deleted, we need to send push notifications
 * to devices to change the badge number
 *
 * @private
 */
const handleNotificationDeleted = async (accountId) => {
  try {
    const c = await call;
    const accountUsers = await c('getUsers', {
      meta: { accountId },
    });

    /*
     * Get all the devices that are affected by this
     * notification
     */
    accountUsers.forEach((user) => {
      // NOTE we do not await here so that multiple promises
      // can be processed at the same time
      RegistrationToken.findAll({
        where: {
          accountId,
          userId: user.id,
        },
      }).then(async (tokens) => {
        const userHasPushDevice = tokens.length > 0;

        if (userHasPushDevice) {
          const numberOfNotifications = await Notification.count({
            where: {
              accountId,
              userId: {
                $or: [-1, user.id],
              },
            },
          });

          // send push notifications to all devices
          pushNotification({
            data: {
              badge: numberOfNotifications,
            },
          }, tokens.map(t => t.registrationToken));
        }
      }).catch((err) => {
        logger.error(err);
      });
    });
  } catch (err) {
    logger.error(err);
  }
};

/**
 * List of events to notify on.
 *
 * @private
 */
const notifiable = {
  [MESSAGE_CREATED]: (data) => {
    const { meta } = data;
    const { accountId, Chat } = meta.raw;

    // Are any of the participants of the room online?
    const users = Chat.Participants.filter(p => (p.realType === 'user'));

    if (users.length === 0) {
      handleNewChat(accountId, Chat.id, data);
    } else {
      handleNewMessage(accountId, users, data);
    }
  },
  [NOTIFICATION_DELETED]: (data) => {
    const { meta } = data;
    const { accountId } = meta.raw;
    handleNotificationDeleted(accountId, data);
  },
};

/**
 * @private
 */
const shouldNotify = (event) => {
  return Object.keys(notifiable).indexOf(event) !== -1;
};

/**
 * See if there is anyone online to handle the event.
 *
 * If there is no one online to handle the event, send
 * a notification to the appropriate people
 *
 * @param {Object} data
 */
const notify = async (data) => {
  const { event, ts, meta } = data;

  const willNotify = shouldNotify(event);

  if (willNotify) {
    try {
      // See if someone else has already handled this event
      const { accountId } = meta.raw;
      const hashCode = hash(data);
      const key = `rtc:notify:${accountId}:${ts}:${hashCode}`;
      const didSet = await setnxPromise(key, +new Date());

      if (didSet === 1) {
        // We have the lock, it's time to roll!
        redis.expire(key, 10);
        notifiable[event](data);
      }
    } catch (e) {
      logger.error(e);
    }
  }
};

module.exports = notify;
