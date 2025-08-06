// producer.js
const { Kafka } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'my-producer',
  brokers: ['localhost:9092'], // آدرس Kafka
});

const producer = kafka.producer();

const run = async () => {
  await producer.connect();

  const message = {
    value: 'سلام از پابلیشر!',
  };

  await producer.send({
    topic: 'my-topic',
    messages: [message],
  });

  console.log('پیام ارسال شد:', message.value);

  await producer.disconnect();
};

run().catch(console.error);
