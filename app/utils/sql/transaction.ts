import { SQLiteDatabase } from "expo-sqlite";

type Resource = {
    filename: string;
    filetype: string;
    filesize: number;
    fileurl: string;
    module_id: number;
};

type urlDB = {
    url: string
}

type Module = {
    id: number;
    moduleid: number;
    modulename: string;
    moduleintro: string;
};

const getTableInfo = async (db: SQLiteDatabase, tableName: string) => {
    const result = await db.getAllAsync(`PRAGMA table_info(${tableName});`);
    return result;
};

const recreateTable = async (
    db: SQLiteDatabase,
    tableName: string,
    newSchema: string,
    backupQuery: string,
    restoreQuery: string
) => {
    await db.withExclusiveTransactionAsync(async (tx) => {
        await tx.execAsync(`CREATE TABLE ${tableName}_backup AS ${backupQuery};`);
        await tx.execAsync(`DROP TABLE ${tableName};`);
        await tx.execAsync(`CREATE TABLE ${tableName} (${newSchema});`);
        await tx.execAsync(restoreQuery);
        await tx.execAsync(`DROP TABLE ${tableName}_backup;`);
    });
};

export const initializeDB = async (db: SQLiteDatabase) => {
    const expectedSchemas = {
        modules: {
            schema: `
            moduleid INTEGER PRIMARY KEY NOT NULL,
            modulename TEXT NOT NULL,
            moduleintro TEXT
        `,
            backupQuery: `SELECT moduleid, modulename, moduleintro FROM modules`,
            restoreQuery: `
            INSERT INTO modules (moduleid, modulename, moduleintro)
            SELECT moduleid, modulename, moduleintro FROM modules_backup;
        `,
        },
        resources: {
            schema: `
            id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            filename TEXT NOT NULL,
            filetype TEXT,
            fileurl TEXT,
            filesize INTEGER,
            module_id INTEGER,
            FOREIGN KEY (module_id) REFERENCES modules(moduleid)
        `,
            backupQuery: `SELECT id, filename, filetype, fileurl, module_id FROM resources`,
            restoreQuery: `
            INSERT INTO resources (id, filename, filetype, fileurl, module_id)
            SELECT id, filename, filetype, fileurl, module_id FROM resources_backup;
        `,
        },
        notes: {
            schema: `
            id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            title TEXT,
            content TEXT
        `,
            backupQuery: `SELECT id, title, content FROM notes`,
            restoreQuery: `
            INSERT INTO notes (id, title, content)
            SELECT id, title, content FROM notes_backup;
        `,
        },
        backend_url: {
            schema: `
            url TEXT
        `,
            backupQuery: `SELECT url FROM backend_url`,
            restoreQuery: `
            INSERT INTO backend_url (url)
            SELECT url FROM backend_url_backup
        `
        }
    };

    for (const [tableName, { schema, backupQuery, restoreQuery }] of Object.entries(expectedSchemas)) {
        const currentSchema = await getTableInfo(db, tableName);

        if (currentSchema.length === 0) {
            await db.execAsync(`CREATE TABLE IF NOT EXISTS ${tableName} (${schema});`);
        } else {
            const existingSchema = currentSchema.map((col: any) => `${col.name} ${col.type}`);
            const expectedSchema = schema
                .split(',')
                .map((col) => col.trim().split(' ').slice(0, 2).join(' '));

            if (JSON.stringify(existingSchema) !== JSON.stringify(expectedSchema)) {
                await recreateTable(db, tableName, schema, backupQuery, restoreQuery);
            }
        }
    }
};


export const ModuleDatabases = () => {
    const insertModule = async (
        db: SQLiteDatabase,
        module_id: number,
        module_name: string,
        module_intro: string,
        files: Array<{
            fileName: string;
            fileUri: string;
            fileSize: number;
            mimeType: string;
        }>
    ) => {
        await db.runAsync(
            `INSERT INTO modules (moduleid, modulename, moduleintro) VALUES (?, ?, ?);`,
            [module_id, module_name, module_intro]
        );

        files.forEach(async (file) => {
            await db.runAsync(
                `INSERT INTO resources (filename, filetype, filesize, fileurl, module_id) VALUES (?, ?, ?, ?, ?);`,
                [file.fileName, file.mimeType, file.fileSize, file.fileUri, module_id]
            );
        });
    };

    const getModules = async (db: SQLiteDatabase): Promise<Module[]> => {
        const result = await db.getAllAsync(`SELECT * FROM modules;`);
        return result as Module[];
    };

    const getResources = async (db: SQLiteDatabase, module_id: number): Promise<Resource[]> => {
        const result = await db.getAllAsync(
            `SELECT * FROM resources WHERE module_id = ?;`,
            [module_id]
        );
        return result as Resource[];
    };

    const getModuleAndResources = async (db: SQLiteDatabase) => {
        const modules = await getModules(db);
        const result = await Promise.all(
            modules.map(async (module) => {
                const resources = await getResources(db, module.moduleid);
                return { ...module, resources };
            })
        );
        return result;
    };

    const updateModuleAndResources = async (db: SQLiteDatabase,
        module_id: number,
        module_name: string,
        module_intro: string,
        files: Array<{
            fileName: string;
            fileUri: string;
            fileSize: number;
            mimeType: string;
        }>) => {
        await db.runAsync(`UPDATE modules SET modulename = ?, moduleintro = ? WHERE moduleid = ?;`, [module_name, module_intro, module_id]);
        await db.runAsync(`DELETE FROM resources WHERE module_id = ?;`, [module_id]);
        files.forEach(async (file) => {
            await db.runAsync(`INSERT INTO resources (filename, filetype, filesize, fileurl, module_id) VALUES (?, ?, ?, ?, ?);`, [file.fileName, file.mimeType, file.fileSize, file.fileUri, module_id]);
        }
        );
    }

    const deleteModule = async (db: SQLiteDatabase, module_id: number) => {
        await db.runAsync(`DELETE FROM modules WHERE moduleid = ?;`, [module_id]);
        await db.runAsync(`DELETE FROM resources WHERE module_id = ?;`, [module_id]);
    };

    const deleteAllModules = async (db: SQLiteDatabase) => {
        await db.runAsync(`DELETE FROM modules;`);
        await db.runAsync(`DELETE FROM resources;`);
    };

    return {
        initializeDB,
        insertModule,
        getModules,
        getResources,
        getModuleAndResources,
        updateModuleAndResources,
        deleteModule,
        deleteAllModules
    };
};

export const NoteDatabases = () => {
    const getNotes = async (db: SQLiteDatabase) => {
        const notes = await db.getAllAsync('SELECT * FROM notes;');
        return notes;
    };

    const addNote = async (db: SQLiteDatabase, title: string, content: string) => {
        await db.runAsync('INSERT INTO notes (title, content) VALUES (?, ?);', [
            title,
            content
        ]);
    };

    const updateNote = async (
        db: SQLiteDatabase,
        id: number,
        title: string,
        content: string
    ) => {
        await db.runAsync('UPDATE notes SET title = ?, content = ? WHERE id = ?;', [
            title,
            content,
            id
        ]);
    };

    const deleteNote = async (db: SQLiteDatabase, id: number) => {
        await db.runAsync('DELETE FROM notes WHERE id = ?;', [id]);
    };

    return { initializeDB, getNotes, addNote, updateNote, deleteNote };
};

export const backendUrlDatabases = () => {
    const getBackendUrl = async (db: SQLiteDatabase) => {
        const url = await db.getAllAsync("SELECT * FROM backend_url") as urlDB[];
        return url[0]?.url
    };
    const addBackendUrl = async (db: SQLiteDatabase, url: string) => {
        await db.runAsync('INSERT INTO backend_url (url) VALUES (?);', [
            url
        ]);
    };
    const deleteBackendUrl = async (db: SQLiteDatabase) => {
        await db.runAsync('DELETE FROM backend_url');
    };
    return {
        initializeDB,
        getBackendUrl,
        addBackendUrl,
        deleteBackendUrl
    }
}
