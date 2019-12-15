r = require('rethinkdb')

r.connect({ host: 'localhost', port: 28015 },async function(err, conn) {
  if(err) throw err;

  await r.table('Degrees').filter({"year": 2018}).sum('degree').
  run(conn, function(err, cursor) {
    if (err) throw err;
   console.log(cursor);
});
  
  
});