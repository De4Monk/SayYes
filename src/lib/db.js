import { createRxDatabase } from 'rxdb';
import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';

export const initDB = async () => {
    const db = await createRxDatabase({
        name: 'sayyesdb',
        storage: getRxStorageDexie(),
    });

    // Define collections here later
    // await db.addCollections({ ... });

    return db;
};
