import r from 'rethinkdb';

const isString = x => typeof x === 'string' || x instanceof String;

export default function rethinkAdapter(dbHost, dbPort, dbName){
    
    let dbConnection;
    const connect = async function connectFn(){
        dbConnection = await r.connect({
            host: dbHost,
            port: dbPort
        });
        dbConnection.use(dbName);
    }

    const close = async function closeFn(){
        return dbConnection.close();
    }

    const insert = async function insertDocument(table, data){
        try {
            const result = await r.table(table)
                .insert(data, {returnChanges:true})
                .run(dbConnection);
                
            // @ts-ignore
            return result.changes[0].new_val;
        } catch(err) {
            console.log(err);
        }
    }

    const update = async function updateDocument(table, id, data){
        try {
            const result = await r.table(table)
                .get(id)
                .update(data, {returnChanges:true})
                .run(dbConnection);
            
            if(result.replaced === 0)
                throw new Error("Not Found");

            // @ts-ignore
            return result.changes[0].new_val;
        } catch(err) {
            console.log(err);
        }
    }

    const replace = async function replaceDocument(table, id, data){
        try {
            const result = await r.table(table)
                .get(id)
                .replace({id, ...data}, {returnChanges:true})
                .run(dbConnection);
            
            if(result.replaced === 0)
                throw new Error("Not Found");

            // @ts-ignore
            return result.changes[0].new_val;
        } catch(err) {
            console.log(err);
        }
    }

    const remove = async function removeDocument(table, id){
        try {
            const result = await r.table(table)
                .get(id)
                .delete({returnChanges:true})
                .run(dbConnection);
            
            if(result.deleted === 0)
                throw new Error("Not Found");
                
            // @ts-ignore
            return result.changes[0].old_val;
        } catch(err) {
            console.log(err);
        }
    }

    const get = async function getDocument(table, filter){
        try {
            if(isString(filter))
                filter = {id: filter};
                
            const result = await r.table(table)
            .filter(filter)
            .run(dbConnection);
            
            const date = await result.toArray();
            if(date.length === 0)
                throw new Error("Not Found");
                
            return date;
        } catch(err) {
            console.log(err);
        }
    }

    const getAll = async function getAllDocument(table, limit = 0, start = 0){
        try {
            let query = r.table(table).filter(r.expr(true));

            if(start)
                query = query.skip(start);

            if(limit)
                query = query.limit(limit);
                
            const result = await query.run(dbConnection);
            const data = await result.toArray();

            return data;
        } catch(err) {
            console.log(err);
        }
    }

    return {
        connect,
        close,
        insert,
        replace,
        update,
        remove,
        get,
        getAll
    }
}