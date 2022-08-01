/**
 * Registration Tokens are devices like iOS and Android that have
 * subscribed for push notifications. We can also use these for
 * desktops as well. See the meta for information on device type.
 */
module.exports = function (sequelize, Sequelize) {
  const RegistrationToken = sequelize.define('RegistrationToken', {
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
  }, {
    indexes: [
      {
        unique: true,
        fields: ['userId'],
      },
    ],
    timestamps: true,
    // NOT paranoid on purpose: we don't care about this transient table
    paranoid: false,
  });

  RegistrationToken.cleanAttributes = ['accountId', 'registrationToken', 'createdAt', 'updatedAt'];

  return RegistrationToken;
};
