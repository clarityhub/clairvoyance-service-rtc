const versionRouter = require('express-version-route');
const { weakAuthMiddleware } = require('service-claire/middleware/auth');
const makeMap = require('service-claire/helpers/makeMap');
const cors = require('cors');

const v1_0 = require('../v1_0/controllers/tokens');

module.exports = function (router) {
  router.route('/tokens')
    .options(cors())
    .post(
      cors(),
      weakAuthMiddleware,
      versionRouter.route(makeMap({
        '1.0': v1_0.createToken,
        default: v1_0.createToken,
      }))
    );
};
