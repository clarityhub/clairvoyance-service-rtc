const redis = require('service-claire/services/redis');
const call = require('service-claire/rpc/call');
const logger = require('service-claire/helpers/logger');
const publish = require('../../v1_0/publications');
const { ONLINE, OFFLINE } = require('../../constants/statuses');
const { STATUS_UPDATED } = require('service-claire/events');

const smembersPromise = (...args) => {
  return new Promise((resolve, reject) => {
    redis.smembers(...args, (err, res) => {
      if (err) {
        reject(err);
      }
      resolve(res);
    });
  });
};
const sremPromise = (...args) => {
  return new Promise((resolve, reject) => {
    redis.srem(...args, (err, res) => {
      if (err) {
        reject(err);
      }
      resolve(res);
    });
  });
};
const saddPromise = (...args) => {
  return new Promise((resolve, reject) => {
    redis.sadd(...args, (err, res) => {
      if (err) {
        reject(err);
      }
      resolve(res);
    });
  });
};

/**
 * Get a consistent key for redis key-value entries
 *
 * @private
 * @returns String
 */
const prefix = (accountId) => {
  return `rtc:statuses:${accountId}`;
};

/**
 * Get a consistent value for redis key-value entries
 *
 * @private
 * @returns String
 */
const value = (accountId, participantType, uuid, device = 'webapp') => {
  return `${accountId}:${participantType}:${uuid}:${device}`;
};

/**
 * @private
 */
const updateStatus = async (status, user, device) => {
  const { accountId, participantId, participantType } = user;

  const userObject = {
    [participantType === 'client' ? 'clientId' : 'userId']: participantId,
  };

  try {
    const u = await call.then(c => c('getUser', {
      meta: userObject,
    }));

    const key = value(accountId, participantType, u.uuid, device);
    let sendUpdate = true;

    if (status === OFFLINE) {
      await sremPromise(prefix(accountId), key);
      const newValues = await smembersPromise(prefix(accountId));

      // if newValues still has a key for this user, do not
      // send an update
      if (newValues.some(k => k.indexOf(u.uuid) !== -1)) {
        sendUpdate = false;
      }
    } else {
      const oldValues = await smembersPromise(prefix(accountId));
      await saddPromise(prefix(accountId), key);

      // if oldValues had a key for this user already, do not
      // send an update
      if (oldValues.some(k => k.indexOf(u.uuid) !== -1)) {
        sendUpdate = false;
      }
    }

    if (sendUpdate) {
      const message = {
        event: STATUS_UPDATED,
        meta: {
          raw: {
            participantId,
            participantType,
            accountId,
            status,
          },
          clean: {
            uuid: u.uuid,
            participantType,
            status,
          },
        },
      };

      publish(message);
    }
  } catch (e) {
    logger.error(e);
  }
};

/**
 * When a user says they are online or offline, we
 * store that value (and device) in redis
 *
 * We then send it off to MQ so that other websockets
 * will get the new value
 */
const forward = async (e, socket) => {
  const status = e.meta.status || ONLINE;
  const { device, user } = socket;

  updateStatus(status, user, device);
};

/**
 * Disconnecting a device is the equivalent of going
 * offline on that device.
 */
const disconnect = async (socket) => {
  const status = OFFLINE;
  const { device, user } = socket;

  updateStatus(status, user, device);
};

/**
 * Ask Redis for all online users in the given account
 */
const getOnlineUsers = async (user) => {
  const { accountId } = user;

  const values = await smembersPromise(prefix(accountId));

  return values.map((v) => {
    const parts = v.split(':');
    const [,, uuid] = parts;

    return {
      uuid,
    };
  }).reduce((obj, v) => {
    if (!obj[v.uuid]) {
      obj[v.uuid] = v;
    }
    return obj;
  }, {});
};

/**
 * Determine if the user should get the update.
 *
 * The user should get the update if it is in the
 * same account and the user is a real user
 *
 * @returns Boolean
 */
const statusUpdated = (data, user) => {
  if (user.accountId === data.meta.raw.accountId) {
    if (user.participantType === 'user') {
      return true;
    }
  }

  return false;
};

/**
 * Determine if anyone in a given account is online
 *
 * @returns Boolean
 */
const accountOnline = async (accountId) => {
  const values = await smembersPromise(prefix(accountId));

  return values.length > 0;
};

const usersOnline = async (accountId, uuids) => {
  const values = await smembersPromise(prefix(accountId));

  return uuids.every((u) => {
    return values.some(v => v.indexOf(u) !== -1);
  });
};

const userOnline = async (accountId, uuid, filter = false) => {
  const values = await smembersPromise(prefix(accountId));

  return values.some((v) => {
    if (filter) {
      return v.indexOf(uuid) !== -1 && v.indexOf(filter) !== -1;
    }

    return v.indexOf(uuid) !== -1;
  });
};

module.exports = {
  forward,
  disconnect,
  getOnlineUsers,
  statusUpdated,
  accountOnline,
  usersOnline,
  userOnline,
};
