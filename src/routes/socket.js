const call = require('service-claire/rpc/call');
const logger = require('service-claire/helpers/logger');
const {
  CHAT_CREATED,
  CHAT_UPDATED,
  MESSAGE_CREATED,
  MESSAGE_COMPOSED,
  PARTICIPANT_JOINED,
  PARTICIPANT_UPDATED,
  PARTICIPANT_TYPING_END,
  PARTICIPANT_TYPING,
  STATUS_UPDATED,
  NOTIFICATION_DELETED,
  SUGGESTION_CREATED,
  SUGGESTION_DELETED,
} = require('service-claire/events');
const {
  forward: statusForward,
  disconnect,
  getOnlineUsers,
  statusUpdated,
} = require('../v1_0/handlers/onlineStatus');
const notify = require('../v1_0/handlers/notify');
const { notificationDeleted } = require('../v1_0/handlers/notifications');
const {
  subscribeToChat,
  chatCreated,
  chatUpdated,
  messageComposed,
  messageCreated,
  participantJoined,
  chatParticipantUpdated,
  chatTyping,
} = require('../v1_0/handlers/chat');
const {
  suggestionCreated,
  suggestionDeleted,
} = require('../v1_0/handlers/suggestions');
const {
  Token,
} = require('../models');
const publish = require('../v1_0/publications');

const SocketIO = require('socket.io');

const sockets = new Map();

let io = null;

/**
 * Clean up events and push them off to get published to all RTC services
 *
 * @private
 */
const forward = async (e, socket) => {
  if (!e.meta.uuid) {
    // Don't publish typing events for rooms that don't exist
    return;
  }
  const event = Object.assign({}, e);

  if (!socket.chats[e.meta.uuid]) {
    // make an RPC call to get participants
    let chat;
    try {
      chat = await call.then(c => c('getChat', {
        meta: {
          chatUuid: e.meta.uuid,
          accountId: socket.user.accountId,
        },
      }));
      const { participants } = chat;
      socket.chats[e.meta.uuid] = { participants };
    } catch (err) {
      logger.error(err);
    }
  }

  event.meta = {
    raw: e.meta,
    clean: {
      uuid: e.meta.uuid,
      participant: {
        uuid: e.meta.participantUuid,
      },
      createdAt: (new Date()).toISOString(),
    },
    socket: {
      user: socket.user.dataValues,
      participants: socket.chats[e.meta.uuid].participants,
    },
  };

  if (e.meta.message) {
    event.meta.clean.text = e.meta.message;
    event.meta.raw.text = e.meta.message;
  }

  publish(event);
};

/**
 * Socket
 */
module.exports = (router, app, http) => {
  io = SocketIO(http, {
    path: '/rtc/socket.io',
  });

  io.use((socket, next) => {
    if (socket.handshake.query.device) {
      socket.device = socket.handshake.query.device;
    }

    if (socket.handshake.query.token) {
      const { token } = socket.handshake.query;

      if (!token) {
        next(new Error('Authentication Error. Invalid token.'));
      }

      Token.update({
        used: true,
      }, {
        where: {
          uuid: token,
          used: false,
        },
        returning: true,
      }).spread((count, results) => {
        if (count) {
          [socket.user] = results;
          next();
        } else {
          next(new Error('Authentication Error. Could not find token.'));
        }
      });
    } else {
      next(new Error('Authentication Error. Token not present in query string.'));
    }
  });

  io.on('connect', (socket) => {
    socket.chats = {};
    socket.chatSubscriptions = [];

    sockets.set(socket.id, socket);
    socket.on(PARTICIPANT_TYPING, e => forward(e, socket));
    socket.on(PARTICIPANT_TYPING_END, e => forward(e, socket));
    socket.on(STATUS_UPDATED, e => statusForward(e, socket));
    socket.on('chat.subscribe', e => subscribeToChat(e, socket));

    // Don't send clients all the user statuses
    if (socket.user.participantType === 'user') {
      // The socket isn't really "ready" like SocketIO says
      // it is
      setTimeout(() => {
        getOnlineUsers(socket.user).then((data) => {
          socket.emit('status.all', {
            event: 'status.all',
            ts: +new Date(),
            meta: data,
          });
        });
      }, 1000);
    }

    socket.on('disconnect', () => {
      logger.log('socket disconnected');
      disconnect(socket);
      sockets.delete(socket.id);
    });
  });
};

module.exports.socketCallback = (data) => {
  notify(data);

  // Determine who to send the data to
  sockets.forEach((socket) => {
    let allowed = false;

    switch (data.event) {
      case CHAT_CREATED:
        socket.chats[data.meta.raw.uuid] = {
          participants: data.meta.raw.participants,
        };
        allowed = chatCreated(data, socket.user);
        break;
      case CHAT_UPDATED:
        socket.chats[data.meta.raw.uuid] = {
          participants: data.meta.raw.Participants,
        };
        allowed = chatUpdated(data, socket.user, socket.chatSubscriptions);
        break;
      case MESSAGE_CREATED:
        allowed = messageCreated(data, socket.user, socket.chatSubscriptions);
        break;
      case MESSAGE_COMPOSED:
        allowed = messageComposed(data, socket.user);
        break;
      case PARTICIPANT_JOINED:
        socket.chats[data.meta.clean.chatId] = {
          participants: data.meta.raw.Chat.Participants,
        };
        allowed = participantJoined(data, socket.user, socket.chatSubscriptions);
        break;
      case PARTICIPANT_UPDATED:
        allowed = chatParticipantUpdated(data, socket.user);
        break;
      case PARTICIPANT_TYPING_END:
      case PARTICIPANT_TYPING:
        allowed = chatTyping(data, socket);
        break;
      case STATUS_UPDATED:
        allowed = statusUpdated(data, socket.user);
        break;
      case NOTIFICATION_DELETED:
        allowed = notificationDeleted(data, socket.user);
        break;
      case SUGGESTION_CREATED:
        allowed = suggestionCreated(data, socket.user, socket.chatSubscriptions);
        break;
      case SUGGESTION_DELETED:
        allowed = suggestionDeleted(data, socket.user, socket.chatSubscriptions);
        break;
      default:
        allowed = false;
    }

    if (allowed) {
      socket.emit(data.event, {
        event: data.event,
        ts: data.ts,
        meta: data.meta.clean,
      });
    }
  });
};
