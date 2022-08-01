const { connect } = require('service-claire/services/pubsub');
const logger = require('service-claire/helpers/logger');

let channelPromise;

const exchange = `${process.env.NODE_ENV || 'development'}.rtc`;

if (!channelPromise) {
  channelPromise = new Promise((resolve, reject) => {
    connect.then((c) => {
      return c.createChannel();
    }).then((ch) => {
      return ch.assertExchange(exchange, 'fanout', { durable: false }).then(() => {
        resolve(ch);
      });
    }).catch((err) => {
      logger.error(err);
      reject(err);
    });
  });
}

module.exports = (data) => {
  channelPromise.then(channel => channel.publish(exchange, '', Buffer.from(JSON.stringify(data))));
};
