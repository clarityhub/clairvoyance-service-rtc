const { connect } = require('service-claire/services/pubsub');
const { socketCallback } = require('../../routes/socket');

const exchange = `${process.env.NODE_ENV || 'development'}.rtc`;

const subscribe = async function sub() {
  const connection = await connect;
  const ch = await connection.createChannel();

  ch.assertExchange(exchange, 'fanout', { durable: false });

  // Intentionally leaving out a queue. All RTC services should
  // receive all events
  const q = await ch.assertQueue('', { exclusive: true });
  const ok = await ch.bindQueue(q.queue, exchange, '');

  ch.consume(q.queue, (msg) => {
    const message = JSON.parse(msg.content.toString());

    socketCallback(message);
  }, { noAck: true });

  return ok;
};

module.exports = subscribe;
