import amqp from "amqplib";
let flag = [0, 0, 0];
const delay = t =>
{
    return new Promise((resolve, reject) => setTimeout(() => resolve(), t));
}
const reset = ()=>
{
    return new Promise((resolve, reject) => 
    {
        setTimeout(() =>
        {
            for (let i = 0; i < 3; ++i)
            {
                flag[i] = 0;
            }
            resolve();
        }, 15000);
    });
}
const printFlags = () =>
{
    return new Promise((resolve, reject) => 
        {
            setTimeout(() =>
            {
                console.log(flag);
                resolve();
            }, 15000);
        });
}
const monitor_slave = async () =>
{
    try
    {
        const amqpUrl = "amqp://localhost";
        const connection = await amqp.connect(amqpUrl);
        const channel = await connection.createChannel();

        const callQueue = "Call";
        const amqpQueue = await channel.assertQueue(callQueue, { durable: false });

        channel.prefetch(5); // Max concurrent calls 
        setInterval(reset, 60000);
        setInterval(printFlags, 15000);
        channel.consume(amqpQueue.queue, async message => {
            if (!message)
                return;
            const params = message.content.toString();
            console.log(params);
            console.log(flag);
            flag[parseInt(params)] = 1;
            await delay(1500);
            channel.sendToQueue(message.properties.replyTo,
                Buffer.from(`Ok`), {
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
const master_monitor = async () =>
{
    try
    {
        const amqpUrl = "amqp://localhost";
        const connection = await amqp.connect(amqpUrl);
        const channel = await connection.createChannel();
        const callQueue = "Call1";
        const amqpQueue = await channel.assertQueue(callQueue, { durable: false });

        channel.prefetch(5); // Max concurrent calls 
        channel.consume(amqpQueue.queue, async message => {
            if (!message)
                return;
            const params = message.content.toString();
            let msg = '';
            for (let i = 0; i < 3; ++i)
            {
                msg += flag[i];
            }
            console.log(params);
            await delay(1500);
            channel.sendToQueue(message.properties.replyTo,
                Buffer.from(`${msg}`), {
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
monitor_slave();
master_monitor();