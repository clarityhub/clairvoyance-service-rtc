module.exports = {
  up(queryInterface, Sequelize) {
    return queryInterface.createTable(
      'Tokens',
      {
        id: {
          type: Sequelize.BIGINT,
          primaryKey: true,
          autoIncrement: true,
        },
        uuid: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          validate: {
            notEmpty: true,
          },
        },
        orgId: {
          type: Sequelize.BIGINT,
          validate: {
            notEmpty: true,
          },
        },
        used: {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
        },
        participantId: {
          type: Sequelize.BIGINT,
          validate: {
            notEmpty: true,
          },
        },
        participantType: {
          type: Sequelize.ENUM('user', 'client'),
          validate: {
            notEmpty: true,
          },
        },

        createdAt: Sequelize.DATE,
        updatedAt: Sequelize.DATE,
        deletedAt: Sequelize.DATE,
      }
    );
  },
  down(queryInterface) {
    return queryInterface.dropTable('Tokens');
  },
};
