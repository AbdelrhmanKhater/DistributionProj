import amqp from "amqplib";
import generateUuid from "uuid/v4";
let flags;
let reply;
let amqpUrl_mm;
let connection_mm;
let channel_mm;
let callQueue_mm;
let replayQueue_mm;
let amqpQueue_mm;
let correlationId_mm;
let interval_mm;
let arr_sum = [0, 0, 0];
let sum;
let amqpUrl_ms = [];
let connection_ms = [];
let channel_ms = [];
let callQueue_ms = [];
let replayQueue_ms = [];
let correlationId_ms = [];
let message_ms = [];
let amqpQueue_ms = [];
let interval_ms = [];
let channel_gm;
let amqpQueue_gm;
let callQueue_gm;
let message_gm;
const delay = t =>
{
    return new Promise((resolve, reject) => setTimeout(() => resolve(), t));
}
const master_monitor = async () =>
{
    try
    {
         amqpUrl_mm = "amqp://localhost";
         connection_mm = await amqp.connect(amqpUrl_mm);
         channel_mm = await connection_mm.createChannel();

         callQueue_mm = "Call1";
         replayQueue_mm = "Replay1";
         amqpQueue_mm = await channel_mm.assertQueue(replayQueue_mm, { exclusive: false });
         //master_slave();
        channel_mm.consume(amqpQueue_mm.queue, message => {
            if (message && message.properties.correlationId === correlationId_mm)
                console.log(message.content.toString())
                flags = message.content.toString();
                for (let i = 0; i < 3; ++i)
                {
                    console.log(flags[i]);
                    if (flags[i] === '0')
                        continue;
                    correlationId_ms[i] = generateUuid();
                    message_ms[i] = `${reply}`;
    
                    channel_ms[i].sendToQueue(callQueue_ms[i],
                        Buffer.from(message_ms[i]), {
                        correlationId: correlationId_ms[i],
                        replyTo: amqpQueue_ms[i].queue
                    });
                }
        }, { noAck: true });

        process.on('exit', _ => {
            connection_mm.close();
            clearInterval(interval_mm);
        });
    }
    catch(err)
    {
        console.log(err);
    }
}
const gateway_master = async() =>
{
    const amqpUrl = "amqp://localhost";
    const connection = await amqp.connect(amqpUrl);
    channel_gm = await connection.createChannel();
    
    callQueue_gm = "Call2";
    amqpQueue_gm = await channel_gm.assertQueue(callQueue_gm, { durable: false });
    
    channel_gm.prefetch(5); // Max concurrent calls 
    
    channel_gm.consume(amqpQueue_gm.queue, async message => {
        if (!message)
            return;
        message_gm = message;
        const params = message.content.toString();
        console.log(params)
        reply = params;
        correlationId_mm = generateUuid();
        const message_mm = `get`;
        await channel_mm.sendToQueue(callQueue_mm,
        Buffer.from(message_mm), {
                correlationId: correlationId_mm,
                replyTo: amqpQueue_mm.queue
            });
        await delay(10000);
        sum = 0;
        for (let i = 0; i < 3; ++i)
        {
            console.log(flags[i]);
            if (flags[i] === '1')
                sum += arr_sum[i];
        }
        console.log(flags);
        console.log(arr_sum);
        console.log(sum);
        channel_gm.sendToQueue(message_gm.properties.replyTo,
            Buffer.from(`${sum}`), {
            correlationId: message_gm.properties.correlationId
        });
        channel_gm.ack(message_gm);
    });

    process.on('exit', _ => {
        connection.close();
    });
}
const master_slave = async() =>
{
    try
    {  
        for(let i = 0; i < 3; i++)
        {        
            amqpUrl_ms[i] = "amqp://localhost";
            connection_ms[i] = await amqp.connect(amqpUrl_ms[i]);
            channel_ms[i] = await connection_ms[i].createChannel();

            callQueue_ms[i] = `Call${3 + i}`;
            replayQueue_ms[i] = `Replay${3 + i}`;
            console.log(callQueue_ms[i]);
            amqpQueue_ms[i] = await channel_ms[i].assertQueue(replayQueue_ms[i], { exclusive: false });

          

            await channel_ms[i].consume(amqpQueue_ms[i].queue, message => {
                if (message && message.properties.correlationId === correlationId_ms[i])
                    console.log(message.content.toString());
                    arr_sum [i] = parseInt(message.content.toString());
                    console.log(arr_sum);
            }, { noAck: true });
           
            process.on('exit', _ => {
                connection_ms[i].close();
                clearInterval(interval_ms[i]);
            });
        }
      
    }
    catch(err)
    {
        console.log(err);
    }
}
const main = async() =>
{
    try
    {
        await gateway_master();
        await master_slave();
        await master_monitor();
    }
    catch(err)
    {
        console.log(err);
    }
}
main();
