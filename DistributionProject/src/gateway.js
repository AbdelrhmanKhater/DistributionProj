import amqp from "amqplib";
import generateUuid from "uuid/v4";
const express = require('express'); 
var port = process.env.PORT || 8081;
const app = express();
let callQueue;
let correlationId;
let amqpQueue;
let channel;
let reply;
const gateway_master = async() =>
{
    const amqpUrl = "amqp://localhost";
    const connection = await amqp.connect(amqpUrl);
    channel = await connection.createChannel();

    callQueue = "Call2";
    const replayQueue = "Replay2";
    amqpQueue = await channel.assertQueue(replayQueue, { exclusive: false });
     correlationId = generateUuid();
      process.on('exit', _ => {
        connection.close();
        clearInterval(interval);
    });
}
gateway_master();
app.get('/', async(req, res)=> {
    let date = await req.param('date');
    //console.log(date);
    await channel.sendToQueue(callQueue,
        Buffer.from(date), {
        correlationId: correlationId,
        replyTo: amqpQueue.queue
    });
    await channel.consume(amqpQueue.queue,  message => {
        if (message && message.properties.correlationId === correlationId)
            reply = message.content.toString();
            res.setHeader("Content-Type", "text/html");
res.write(reply);
            //res.send(reply);
            console.log(reply);
    }, { noAck: false });
    
});
app.listen(port);