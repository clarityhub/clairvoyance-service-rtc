const { badRequest, ok, error } = require('service-claire/helpers/responses');
const logger = require('service-claire/helpers/logger');

const {
  RegistrationToken,
} = require('../../models');

const register = async (req, res) => {
  const { accountId, userId } = req.user;
  const { registrationToken } = req.body;

  try {
    if (!registrationToken || registrationToken.trim() === '') {
      return badRequest(res)({
        reason: 'Invalid registration token. Could not register your device',
      });
    }

    await RegistrationToken.create({
      accountId,
      userId,
      registrationToken,
      meta: {
        // TODO catalog device type
      },
    });

    ok(res)({});
  } catch (err) {
    logger.error(err);
    error(res)(err);
  }
};

module.exports = {
  register,
};
