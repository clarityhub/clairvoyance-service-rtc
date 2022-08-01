module.exports = {
  up(queryInterface) {
    return queryInterface.bulkInsert('Tokens', [{
      uuid: '32fd8b05-75e6-4246-aef5-bbb619191692',
      accountId: '1',
      used: true,
      participantId: '1',
      participantType: 'client',
    }, {
      uuid: '09c81bff-428e-4732-a6e8-8a6d708a7c53',
      accountId: '1',
      used: false,
      participantId: '1',
      participantType: 'client',
    }]);
  },

  down(queryInterface) {
    return queryInterface.bulkDelete('Tokens', null, {});
  },
};
