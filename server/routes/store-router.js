/*
    This is where we'll route all of the received http requests
    into controller response functions.
    
    @author McKilla Gorilla
*/
const express = require('express')
const StoreController = require('../controllers/store-controller')
const router = express.Router()
const auth = require('../auth')

// Playlist CRUD (all require auth)
router.post('/playlist', auth.verify, StoreController.createPlaylist)
router.delete('/playlist/:id', auth.verify, StoreController.deletePlaylist)
router.put('/playlist/:id', auth.verify, StoreController.updatePlaylist)

// Playlist queries (flexible - guests allowed)
router.get('/playlist/:id', StoreController.getPlaylistById)
router.get('/playlistpairs', auth.verify, StoreController.getPlaylistPairs)
router.get('/playlists', StoreController.getPlaylists)

// Additional playlist features
router.put('/playlist/:id/publish', auth.verify, StoreController.publishPlaylist)
router.post('/playlist/:id/play', StoreController.playPlaylist)
router.post('/playlist/:id/copy', auth.verify, StoreController.copyPlaylist)

module.exports = router