const {AutotaskClient} = require('@openzeppelin/defender-autotask-client');
const fs = require('fs').promises;
const path = require('path');
const JSZip = require("jszip");
require('dotenv').config();

const client = new AutotaskClient({
    apiKey: process.env.DEFENDER_API_KEY,
    apiSecret: process.env.DEFENDER_API_SECRET
});

async function createFoldersAndConfigs(items) {
    const baseDirectory = path.join(__dirname, 'tasks');

    fs.mkdir(baseDirectory, {recursive: true})
        .then(() => {
            items.forEach(async item => {
                const folderPath = path.join(baseDirectory, item.name);
                // Ensure the folder exists, create if it doesn't
                await fs.mkdir(folderPath, {recursive: true});
                // Now that we know the folder exists, create/replace the config.json file
                const configPath = path.join(folderPath, 'config.json');
                await fs.writeFile(configPath, JSON.stringify(item, null, 2), 'utf8');
            });
        })
        .catch(err => console.error('Error creating base directory:', err));
}

async function updateAndCreateTasks() {
    const baseDirectory = path.join(__dirname, 'testing');

    try {
        const directories = await fs.readdir(baseDirectory, {withFileTypes: true});
        const folders = directories.filter(dirent => dirent.isDirectory()).map(dirent => dirent.name);

        for (const folder of folders) {
            let configData;
            let autotaskId;

            const folderPath = path.join(baseDirectory, folder);
            const configPath = path.join(folderPath, 'config.json');
            const indexPath = path.join(folderPath, 'index.js');

            let shouldCreate = true;

            const configFile = await fs.readFile(configPath, 'utf8');
            const indexFile = await fs.readFile(indexPath, 'utf8');

            configData = JSON.parse(configFile);
            // Check if autotaskId exists
            if (configData.autotaskId) {
                autotaskId = configData.autotaskId;
                shouldCreate = false; // autotaskId exists, so we need to update instead of create
            }

            if (shouldCreate) {
                const zip = new JSZip();
                zip.file("index.js", indexFile);
                const zippedContent = await zip.generateAsync({type: "nodebuffer"});
                configData.encodedZippedCode = zippedContent.toString('base64');
                await client.create(configData);
            } else {
                // update task
                await client.update(configData);
                await client.updateCodeFromSources(autotaskId, {'index.js': indexFile});
            }

        }
    } catch (err) {
        console.error('Error creating base directory:', err);
    }
}

(async () => {
    await updateAndCreateTasks();
})().catch(console.error);