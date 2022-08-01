const versionRouter = require('express-version-route');
const authMiddleware = require('service-claire/middleware/auth');
const makeMap = require('service-claire/helpers/makeMap');
const cors = require('cors');

const v1_0 = require('../v1_0/controllers/devices');

module.exports = function (router) {
  router.route('/devices/register')
    .options(cors())
    .post(
      cors(),
      authMiddleware,
      versionRouter.route(makeMap({
        '1.0': v1_0.register,
        default: v1_0.register,
      }))
    );
};
