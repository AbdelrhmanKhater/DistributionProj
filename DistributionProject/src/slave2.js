import amqp from "amqplib";
import generateUuid from "uuid/v4";
let r = require('rethinkdb');
let val;
const delay = t =>
{
    return new Promise((resolve, reject) => setTimeout(() => resolve(), t));
}
async function monitor_slave() {
    try
    {
        const amqpUrl = "amqp://localhost";
        const connection = await amqp.connect(amqpUrl);
        const channel = await connection.createChannel();

        const callQueue = "Call";
        const replayQueue = "Replay";
        const amqpQueue = await channel.assertQueue(replayQueue, { exclusive: false });

        let correlationId;
        const interval = setInterval(async _ => {
            correlationId = generateUuid();
            const message = '2';
            console.log(`${message}`)

            channel.sendToQueue(callQueue,
                Buffer.from(message), {
                correlationId: correlationId,
                replyTo: amqpQueue.queue
            });
        }, 5000);

        channel.consume(amqpQueue.queue, message => {
            if (message && message.properties.correlationId === correlationId)
                console.log(message.content.toString())
        }, { noAck: true });

        process.on('exit', _ => {
            connection.close();
            clearInterval(interval);
        });
    }
    catch(err)
    {
        console.log(err);
    }
}
const master_slave = async () =>
{
    try
    {
        const amqpUrl = "amqp://localhost";
        const connection = await amqp.connect(amqpUrl);
        const channel = await connection.createChannel();
    
        const callQueue = "Call5";
        const amqpQueue = await channel.assertQueue(callQueue, { durable: false });
    
        channel.prefetch(5); // Max concurrent calls 
    
        channel.consume(amqpQueue.queue, async message => {
            if (!message)
                return;
    
            const params = message.content.toString();
            console.log(params);
            r.connect({ host: 'localhost', port: 28015 },async function(err, conn) {
                if(err) throw err;
              
                await r.table('Degrees').filter({"year": parseInt(params)}).sum('degree').
                run(conn, function(err, cursor) {
                  if (err) throw err;
                 console.log(cursor);
                 val = cursor;
              });
                
                
              });
    
            await delay(1500);
            channel.sendToQueue(message.properties.replyTo,
                Buffer.from(`${val}`), {
                correlationId: message.properties.correlationId
            });
    
            channel.ack(message);
        });
    
        process.on('exit', _ => {
            connection.close();
        });
    }
    catch(err)
    {
        console.log(err);
    }
}
master_slave();
monitor_slave();