const express = require('express');
const { isWebUri } = require('valid-url');
const xss = require('xss');
const logger = require('../logger');
const FoldersService = require('./folders-service');

const foldersRouter = express.Router();
const bodyParser = express.json();

const serializeFolder = folder => ({
    id: folder.id,
    name: xss(folder.name),
});

foldersRouter
    .route('/folders')
    .get((req, res, next) => {
        FoldersService.getAllFolders(req.app.get('db'))
            .then(folders => {
                res.json(folders.map(serializeFolder));
            })
            .catch(next);
    })
    .post(bodyParser, (req, res, next) => {
        console.log(req.body.name);
        for (const field of ['name']) {
            if (!req.body[field]) {
                logger.error(`${field} is required`);
                return res.status(400).send(`'${field}' is required`);
            }
        }

        const newFolder = { name: xss(req.body.name) };

        FoldersService.insertFolder(
            req.app.get('db'),
            newFolder
        )
            .then(folder => {
                logger.info(`Folder with id ${folder.id} created.`);
                res
                    .status(201)
                    .location(`/folders/${folder.id}`)
                    .json(serializeFolder(folder));
            })
            .catch(next);
    });

foldersRouter
    .route('/folders/:folder_id')
    .all((req, res, next) => {
        const { folder_id } = req.params;
        FoldersService.getById(req.app.get('db'), folder_id)
            .then(folder => {
                if (!folder) {
                    logger.error(`Folder with id ${folder_id} not found.`);
                    return res.status(404).json({
                        error: { message: 'Folder Not Found' }
                    });
                }
                res.folder = folder;
                next();
            })
            .catch(next);

    })
    .get((req, res) => {
        res.json(serializeFolder(res.folder));
    })
    .delete((req, res, next) => {
        const { folder_id } = req.params;
        FoldersService.deleteFolder(
            req.app.get('db'),
            folder_id
        )
            .then(numRowsAffected => {
                logger.info(`Card with id ${folder_id} deleted.`);
                res.status(204).end();
            })
            .catch(next);
    });

module.exports = foldersRouter;