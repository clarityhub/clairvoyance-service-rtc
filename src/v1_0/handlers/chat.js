const chatCreated = (data, user) => {
  if (user.participantType === 'client') {
    return false;
  }

  if (user.accountId === data.meta.raw.accountId) {
    return true;
  }
  return false;
};

const chatUpdated = (data, user, chatSubscriptions) => {
  if (user.accountId === data.meta.raw.accountId) {
    if (user.participantType === 'user') {
      // or chat is empty except for the client
      return true;
    }

    // user is in chat
    const participants = data.meta.raw.Participants || [];
    const self = participants.some(p => (
      p.realId === user.participantId &&
      p.realType === user.participantType
    ));
    // XXX !!!!!
    console.log(data.meta.raw);
    const subscribed = chatSubscriptions.some(uuid => uuid === data.meta.raw.Chat.uuid);

    if (self || subscribed) {
      return true;
    }
  }

  return false;
};

const messageCreated = (data, user, chatSubscriptions) => {
  if (user.accountId === data.meta.raw.accountId) {
    // user is in chat
    const self = data.meta.raw.Chat.Participants.some(p => (
      p.realId === user.participantId &&
      p.realType === user.participantType
    ));

    const solo = data.meta.raw.Chat.Participants.length === 1 &&
      data.meta.raw.Chat.Participants[0].realType === 'client';

    const subscribed = chatSubscriptions.some(uuid => uuid === data.meta.raw.Chat.uuid);

    if (self || subscribed) {
      return true;
    } else if (solo) {
      // or chat is empty except for the client
      return true;
    }
  }

  return false;
};

const participantJoined = (data, user, chatSubscriptions) => {
  if (user.participantType === 'client') {
    // If in that room
    const self = data.meta.raw.Chat.Participants.some(p => (
      p.realId === user.participantId &&
      p.realType === user.participantType
    ));

    const subscribed = chatSubscriptions.some(uuid => uuid === data.meta.raw.Chat.uuid);

    return self || subscribed;
  } else if (user.participantType === 'user') {
    // If in that accountId
    // don't send myself that I joined
    const self = user.participantId === data.meta.raw.realId;
    return data.meta.raw.accountId === user.accountId && !self;
  }

  return false;
};

const chatParticipantUpdated = (data, user) => {
  if (user.participantType === 'client') {
    return false;
  }

  if (user.accountId === data.meta.raw.accountId) {
    return true;
  }
  return false;
};

const messageComposed = (data, user) => {
  return (data.meta.raw.userId === user.participantId && user.participantType === 'user');
};

const chatTyping = (data, socket) => {
  if (socket.user.accountId === data.meta.socket.user.accountId) {
    // find out if I am alone in the room.
    const roomParticipants =
      (socket.chats[data.meta.clean.uuid] && socket.chats[data.meta.clean.uuid].participants)
      || data.meta.socket.participants;
    const solo = roomParticipants.length === 1 &&
      data.meta.socket.user.participantId === roomParticipants[0].realId;

    if (solo) {
      return (data.meta.socket.user.participantId !== socket.user.participantId) ||
        (data.meta.socket.user.participantType !== socket.user.participantType);
    }

    // don't get your own events
    const notMe = roomParticipants.some(p =>
      (socket.user.participantId === p.realId
        && (data.meta.socket.user.participantId !== socket.user.participantId ||
          (data.meta.socket.user.participantType !== socket.user.participantType))));
    return notMe;
  }
  return false;
};

const subscribeToChat = (e, socket) => {
  if (!socket.chatSubscriptions.some(uuid => e.meta.uuid === uuid)) {
    socket.chatSubscriptions.push(e.meta.uuid);
  }
};

module.exports = {
  chatCreated,
  chatUpdated,
  messageCreated,
  participantJoined,
  chatParticipantUpdated,
  messageComposed,
  chatTyping,
  subscribeToChat,
};
