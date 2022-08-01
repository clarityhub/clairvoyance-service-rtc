module.exports = function (sequelize, Sequelize) {
  const Token = sequelize.define('Token', {
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
  }, {
    indexes: [
      {
        unique: true,
        fields: ['uuid'],
      },
    ],
    timestamps: true,
    paranoid: true,
  });

  Token.cleanAttributes = ['used', 'accountId', 'createdAt', 'updatedAt'];

  return Token;
};
