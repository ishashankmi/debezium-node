const { Kafka } = require("kafkajs");
const { Pool } = require("pg");

// Initialize Kafka client
const kafka = new Kafka({
    clientId: "debezium-consumer",
    brokers: ["localhost:9092"],
});

const consumer = kafka.consumer({ groupId: "debezium-group" });

const pool = new Pool({
    host: "localhost",
    user: "postgres",
    password: "mypassword", 
    database: "audit_logs",
    port: 5432,
});

const run = async () => {
    await consumer.connect();
    
    const client = await pool.connect();

    const mydbTopics = ["postgres.public.users", "postgres.public.posts"];
    const messagesTopics = ["postgres-messages.public.user_messages"];
    
    const allTopics = [...mydbTopics, ...messagesTopics];

    for (const topic of allTopics) {
        await consumer.subscribe({ topic, fromBeginning: true });
        console.log(`📡 Subscribed to: ${topic}`);
    }

    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            try {
                const value = JSON.parse(message.value.toString());

                console.log(`\n📥 Received ${value.op == "u" ? "UPDATE" : "DELETE"} from ${topic}`);
                console.log(`🔑 Key: ${message.key ? message.key.toString() : "null"}`);
                console.log(`📦 Value: ${JSON.stringify(value, null, 2)}`);
                
                if (value.before) {
                    try {
                        const query = `
                            INSERT INTO audit_logs (logs, source)
                            VALUES ($1, $2)
                        `;
                        
                        const params = [
                            JSON.stringify(value.before),
                            JSON.stringify(value.source || {}),
                        ];
                        
                        await client.query(query, params);
                        console.log(`✅ Audit log saved for ${topic}`);
                    } catch (dbError) {
                        console.error("❌ Database error:", dbError);
                    }
                }
            } catch (error) {
                console.error("❌ Error processing message:", error);
            }
        },
    });
    
    // Handle graceful shutdown
    process.on('SIGTERM', async () => {
        console.log('Shutting down...');
        await consumer.disconnect();
        client.release();
        await pool.end();
        process.exit(0);
    });
};

run().catch((error) => {
    console.error("❌ Fatal error:", error);
    process.exit(1);
});