module.exports = {
  up(queryInterface, Sequelize) {
    return queryInterface.createTable(
      'Notifications',
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

        accountId: {
          type: Sequelize.BIGINT,
          validate: {
            notEmpty: true,
          },
        },

        userId: {
          type: Sequelize.BIGINT,
          allowNull: false,
        },

        /**
         * This is so that multiple instances don't create
         * an mulitple notifications for the same event
         */
        eventHash: {
          type: Sequelize.STRING,
          unique: true,
          allowNull: false,
          validate: {
            notEmpty: true,
          },
        },

        eventType: {
          type: Sequelize.STRING,
          allowNull: false,
        },

        eventRaw: {
          // JSONB since it is faster to process
          type: Sequelize.JSONB,
        },

        eventClean: {
          // JSONB since it is faster to process
          type: Sequelize.JSONB,
        },

        createdAt: Sequelize.DATE,
        updatedAt: Sequelize.DATE,
        deletedAt: Sequelize.DATE,
      },
      {
        indexes: [
          {
            unique: true,
            fields: ['uuid'],
          },
        ],
      }
    );
  },
  down(queryInterface) {
    return queryInterface.dropTable('Notifications');
  },
};
