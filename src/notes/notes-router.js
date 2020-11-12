const express = require('express');
const { isWebUri } = require('valid-url');
const xss = require('xss');
const logger = require('../logger');
const NotesService = require('./notes-service');

const notesRouter = express.Router();
const bodyParser = express.json();

const serializeNote = note => ({
    id: note.id,
    name: xss(note.name),
    modified: note.modified,
    folder_id: xss(note.folder_id),
    content: xss(note.content),
});

notesRouter
    .route('/notes')
    .get((req, res, next) => {
        NotesService.getAllNotes(req.app.get('db'))
            .then(notes => {
                res.json(notes.map(serializeNote));
            })
            .catch(next);
    })
    .post(bodyParser, (req, res, next) => {
        for (const field of ['name', 'folder_id', 'content']) {
            if (!req.body[field]) {
                logger.error(`${field} is required`);
                return res.status(400).send(`'${field}' is required`);
            }
        }

        const {name, folder_id, content} = req.body;

        // if (!Number.isInteger(folder_id) || folder_id < 1) {
        //     console.log(req.body.folder_id);
        //     logger.error(`Invalid folder ID '${folder_id}' supplied`);
        //     return res.status(400).send('\'folder_id\' must be greater than 0');
        // }


        const newNote = {name, folder_id, content};
        console.log(newNote);

        NotesService.insertNote(
            req.app.get('db'),
            newNote
        )
            .then(note => {
                console.log(note);
                logger.info(`Note with id ${note.id} created.`);
                res
                    .status(201)
                    .location(`/notes/${note.id}`)
                    .json(serializeNote(note));
            })
            .catch(next);
    });

notesRouter
    .route('/notes/:note_id')
    .all((req, res, next) => {
        const { note_id } = req.params;
        NotesService.getById(req.app.get('db'), note_id)
            .then(note => {
                if (!note) {
                    logger.error(`Note with id ${note_id} not found.`);
                    return res.status(404).json({
                        error: { message: 'Note Not Found' }
                    });
                }
                res.note = note;
                next();
            })
            .catch(next);

    })
    .get((req, res) => {
        res.json(serializeNote(res.note));
    })
    .delete((req, res, next) => {
    // TODO: update to use db
        const { note_id } = req.params;
        NotesService.deleteNote(
            req.app.get('db'),
            note_id
        )
            .then(numRowsAffected => {
                logger.info(`Note with id ${note_id} deleted.`);
                res.status(204).end();
            })
            .catch(next);
    });

module.exports = notesRouter;