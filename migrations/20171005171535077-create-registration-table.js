module.exports = {
  up(queryInterface, Sequelize) {
    return queryInterface.createTable(
      'RegistrationTokens',
      {
        id: {
          type: Sequelize.BIGINT,
          primaryKey: true,
          autoIncrement: true,
        },

        accountId: {
          type: Sequelize.BIGINT,
          validate: {
            notEmpty: true,
          },
        },

        userId: {
          type: Sequelize.BIGINT,
          allowNull: false,
          validate: {
            notEmpty: true,
          },
        },

        registrationToken: {
          type: Sequelize.STRING,
          allowNull: false,
          validate: {
            notEmpty: true,
          },
        },

        meta: {
          // JSONB since it is faster to process
          type: Sequelize.JSONB,
        },

        createdAt: Sequelize.DATE,
        updatedAt: Sequelize.DATE,
        deletedAt: Sequelize.DATE,
      }
    );
  },
  down(queryInterface) {
    return queryInterface.dropTable('RegistrationTokens');
  },
};
