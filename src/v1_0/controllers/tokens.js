const { ok, badRequest, error } = require('service-claire/helpers/responses');
const logger = require('service-claire/helpers/logger');
const {
  Token,
} = require('../../models');
const {
  CLIENT,
  USER,
} = require('../../constants/users');

const createToken = async (req, res) => {
  const { accountId, clientId, userId } = req.user;

  if (!clientId && !userId) {
    return badRequest(res)({
      reason: 'We could not identity your account type',
    });
  }

  try {
    let token = null;

    if (clientId) {
      token = await Token.create({
        accountId,
        participantId: clientId,
        participantType: CLIENT,
      }, {
        logging: null,
      });
    } else if (userId) {
      token = await Token.create({
        accountId,
        participantId: userId,
        participantType: USER,
      }, {
        logging: null,
      });
    }

    return ok(res)({
      token: token.uuid,
    });
  } catch (err) {
    logger.error(err);
    error(res)(err);
  }
};

module.exports = {
  createToken,
};
