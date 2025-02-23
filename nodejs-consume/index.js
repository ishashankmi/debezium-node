const { Kafka } = require("kafkajs");

const kafka = new Kafka({
    clientId: "debezium-consumer",
    brokers: ["localhost:9092"],
});

const consumer = kafka.consumer({ groupId: "debezium-group" });

const run = async () => {
    await consumer.connect();

    const topics = ["postgres.public.users", "postgres.public.posts"];

    for (const topic of topics) {
        await consumer.subscribe({ topic, fromBeginning: true });
        console.log(`📡 Subscribed to: ${topic}`);
    }

    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            try {
                const value = JSON.parse(message.value.toString());

                // Ignore inserts
                // if (value.op === "c") return;

                console.log(`\n📥 Received ${value.op == "u" ? "UPDATE" : "DELETE"} from ${topic}`);
                console.log(`🔑 Key: ${message.key ? message.key.toString() : "null"}`);
                console.log(`📦 Value: ${JSON.stringify(value, null, 2)}`);
            } catch (error) {
                console.error("❌ Error processing message:", error);
            }
        },
    });
};

run().catch(console.error);
