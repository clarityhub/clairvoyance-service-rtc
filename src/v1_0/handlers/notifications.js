const notificationDeleted = (data, user) => {
  if (user.accountId === data.meta.raw.accountId) {
    if (user.participantType === 'user') {
      return true;
    }
  }

  return false;
};

module.exports = {
  notificationDeleted,
};
