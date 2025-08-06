// consumer.js
const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'my-consumer',
  brokers: ['localhost:9092'],
});

const consumer = kafka.consumer({ groupId: 'my-group' });

const run = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: 'my-topic', fromBeginning: true });

  console.log('منتظر پیام‌ها هستیم...');

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      console.log(`پیام دریافتی: ${message.value.toString()}`);
    },
  });
};

run().catch(console.error);
