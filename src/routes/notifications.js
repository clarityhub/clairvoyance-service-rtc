const versionRouter = require('express-version-route');
const authMiddleware = require('service-claire/middleware/auth');
const makeMap = require('service-claire/helpers/makeMap');
const cors = require('cors');

const v1_0 = require('../v1_0/controllers/notifications');
const publish = require('../v1_0/publications');

const pubsubNotificationMiddleware = (req, res, next) => {
  if (!req.services) {
    req.services = {};
  }
  req.services.publish = publish;
  next();
};

module.exports = function (router) {
  router.route('/notifications')
    .options(cors())
    .get(
      cors(),
      authMiddleware,
      versionRouter.route(makeMap({
        '1.0': v1_0.getNotifications,
        default: v1_0.getNotifications,
      }))
    )
    .delete(
      cors(),
      authMiddleware,
      pubsubNotificationMiddleware,
      versionRouter.route(makeMap({
        '1.0': v1_0.deleteAllNotifications,
        default: v1_0.deleteAllNotifications,
      }))
    );

  router.route('/notifications/:type/:query')
    .options(cors())
    .delete(
      cors(),
      authMiddleware,
      pubsubNotificationMiddleware,
      versionRouter.route(makeMap({
        '1.0': v1_0.deleteNotifications,
        default: v1_0.deleteNotifications,
      }))
    );

  router.route('/notifications/:uuid')
    .options(cors())
    .delete(
      cors(),
      authMiddleware,
      pubsubNotificationMiddleware,
      versionRouter.route(makeMap({
        '1.0': v1_0.deleteNotification,
        default: v1_0.deleteNotification,
      }))
    );
};
