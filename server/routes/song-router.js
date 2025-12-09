const express = require('express')
const router = express.Router()
const SongController = require('../controllers/song-controller')

router.post('/create', SongController.createSong)
router.get('/', SongController.getSongs)
router.get('/:id', SongController.getSongById)
router.put('/:id', SongController.updateSong)
router.delete('/:id', SongController.deleteSong)
router.post('/:id/play', SongController.playSong)

module.exports = router

