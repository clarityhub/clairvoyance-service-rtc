module.exports = {
  up: (queryInterface) => {
    return queryInterface.renameColumn(
      'Tokens',
      'orgId',
      'accountId'
    );
  },
  down: (queryInterface) => {
    return queryInterface.renameColumn(
      'Tokens',
      'accountId',
      'orgId'
    );
  },
};
