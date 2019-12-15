const document = 'slave';

const create = async function createFn(dbAdapter, data, query){
    try {
        const result = await dbAdapter.insert(document, data);
        return result;
    } catch(err) {
        throw err;
    }
}

const replace = async function replaceFn(dbAdapter, id, data, query){
    try {
        const result = await dbAdapter.replace(document, id, data);
        return result;
    } catch(err) {
        throw err;
    }
}
const update = async function updateFn(dbAdapter, id, data, query){
    try {
        const result = await dbAdapter.update(document, id, data);
        return result;
    } catch(err) {
        throw err;
    }
}

const remove = async function removeFn(dbAdapter, id, query){
    try {
        const result = await dbAdapter.remove(document, id);
        return result;
    } catch(err) {
        throw err;
    }
}

const get = async function getFn(dbAdapter, id, query){
    try {
        const result = await dbAdapter.get(document, id);
        return result;
    } catch(err) {
        throw err;
    }
}

const getAll = async function getAllFn(dbAdapter, query = {}){
    try {
        const result = await dbAdapter.getAll(document, parseInt(query.limit), parseInt(query.start) );
        return {
            data: result,
            limit: query.limit,
            start: query.start
        };
    } catch(err) {
        throw err;
    }
}

export {
    create,
    update,
    replace,
    remove,
    get,
    getAll
};