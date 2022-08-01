const pick = require('lodash/pick');
const { ok, badRequest, error } = require('service-claire/helpers/responses');
const logger = require('service-claire/helpers/logger');
const { NOTIFICATION_DELETED } = require('service-claire/events');
const {
  Notification,
} = require('../../models');

const getNotifications = async (req, res) => {
  const { accountId, userId } = req.user;

  try {
    const notifications = await Notification.findAll({
      where: {
        accountId,
        userId: {
          $or: [-1, userId],
        },
      },
    });

    ok(res)({
      count: notifications.length,
      items: notifications.map((n) => {
        return pick(n, Notification.cleanAttributes);
      }),
    });
  } catch (err) {
    logger.error(err);
    error(res)(err);
  }
};

const deleteAllNotifications = async (req, res) => {
  const { accountId, userId } = req.user;

  try {
    const count = await Notification.destroy({
      where: {
        accountId,
        userId: {
          $or: [-1, userId],
        },
      },
    });

    if (count > 0) {
      req.services.publish({
        event: NOTIFICATION_DELETED,
        ts: new Date(),
        meta: {
          raw: { accountId },
          clean: { count },
        },
      });
    }

    ok(res)({ count });
  } catch (err) {
    logger.error(err);
    error(res)(err);
  }
};

const deleteNotifications = async (req, res) => {
  const { accountId, userId } = req.user;
  const { query, type } = req.params;

  try {
    switch (type) {
      case 'chat': {
        const count = await Notification.destroy({
          where: {
            accountId,
            userId: {
              $or: [-1, userId],
            },
            eventType: 'message',
            'eventRaw.Chat.uuid': query,
          },
        });

        if (count > 0) {
          req.services.publish({
            event: NOTIFICATION_DELETED,
            ts: new Date(),
            meta: {
              raw: { accountId },
              clean: { count },
            },
          });
        }

        ok(res)({ count });
        break;
      }
      case 'message': {
        const count = await Notification.destroy({
          where: {
            accountId,
            userId: {
              $or: [-1, userId],
            },
            eventType: 'message',
            'eventRaw.uuid': query,
          },
        });

        if (count > 0) {
          req.services.publish({
            event: NOTIFICATION_DELETED,
            ts: new Date(),
            meta: {
              raw: { accountId },
              clean: { count },
            },
          });
        }

        ok(res)({ count });
        break;
      }
      default:
        badRequest(res)({ reason: 'Invalid type' });
    }
  } catch (err) {
    logger.error(err);
    error(res)(err);
  }
};

const deleteNotification = async (req, res) => {
  const { accountId, userId } = req.user;
  const { uuid } = req.params;

  try {
    const count = await Notification.destroy({
      where: {
        accountId,
        userId: {
          $or: [-1, userId],
        },
        uuid,
      },
    });

    if (count > 0) {
      req.services.publish({
        event: NOTIFICATION_DELETED,
        ts: new Date(),
        meta: {
          raw: { accountId },
          clean: { count },
        },
      });
    }

    ok(res)({ count });
  } catch (err) {
    logger.error(err);
    error(res)(err);
  }
};

module.exports = {
  getNotifications,
  deleteAllNotifications,
  deleteNotifications,
  deleteNotification,
};
