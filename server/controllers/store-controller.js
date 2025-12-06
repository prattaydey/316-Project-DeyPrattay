const auth = require('../auth')
/*
    This is our back-end API. It provides all the data services
    our database needs. Note that this file contains the controller
    functions for each endpoint.
    
    @author McKilla Gorilla
*/
createPlaylist = async (req, res) => {
    if(auth.verifyUser(req) === null){
        return res.status(400).json({
            errorMessage: 'UNAUTHORIZED'
        })
    }
    const body = req.body;
    console.log("createPlaylist body: " + JSON.stringify(body));
    if (!body) {
        return res.status(400).json({
            success: false,
            error: 'You must provide a Playlist',
        })
    }
    
    try {
        const db = req.app.locals.db;
        const playlist = await db.createPlaylist({
            name: body.name,
            ownerEmail: body.ownerEmail,
            songs: Array.isArray(body.songs) ? body.songs : []
        });
        return res.status(201).json({ playlist });
    } catch (err) {
        console.log("err: " + err);
        return res.status(400).json({
            errorMessage: 'Playlist not created!',
            error: err
        })
    }
}

deletePlaylist = async (req, res) => {
    if(auth.verifyUser(req) === null){
        return res.status(400).json({
            errorMessage: 'UNAUTHORIZED'
        })
    }
    console.log("delete Playlist with id: " + JSON.stringify(req.params.id));
    console.log("delete " + req.params.id);
    const db = req.app.locals.db;
    const playlist = await db.getPlaylistById(req.params.id);
    if (!playlist) return res.status(404).json({ errorMessage: 'Playlist not found!' });
    const me = await db.findUserById(req.userId);
    if (!me || me.email !== playlist.ownerEmail) {
        return res.status(400).json({ errorMessage: 'authentication error' });
    }
    const ok = await db.deletePlaylistById(req.params.id);
    return res.status(ok ? 200 : 404).json(ok ? {} : { errorMessage: 'Playlist not found!' });
}

getPlaylistById = async (req, res) => {
    if(auth.verifyUser(req) === null){
        return res.status(400).json({
            errorMessage: 'UNAUTHORIZED'
        })
    }
    console.log("Find Playlist with id: " + JSON.stringify(req.params.id));
    const db = req.app.locals.db;
    const list = await db.getPlaylistById(req.params.id);
    if (!list) return res.status(400).json({ success: false, error: 'Playlist not found' });
    const me = await db.findUserById(req.userId);
    if (!me || me.email !== list.ownerEmail) {
        return res.status(400).json({ success: false, description: 'authentication error' });
    }
    return res.status(200).json({ success: true, playlist: list });
}

getPlaylistPairs = async (req, res) => {
    if(auth.verifyUser(req) === null){
        return res.status(400).json({
            errorMessage: 'UNAUTHORIZED'
        })
    }
    console.log("getPlaylistPairs");
    const db = req.app.locals.db;
    const me = await db.findUserById(req.userId);
    const pairs = (await db.getPlaylistPairs()).filter(p => p.ownerEmail === me.email)
                    .map(p => ({ _id: p.id, name: p.name }));
    return res.status(200).json({ success: true, idNamePairs: pairs });
}

getPlaylists = async (req, res) => {
    if (auth.verifyUser(req) === null) {
        return res.status(400).json({ errorMessage: 'UNAUTHORIZED' });
    }
    try {
        const db = req.app.locals.db;
        const me = await db.findUserById(req.userId);

        const pairs = await db.getPlaylistPairs();
        const mine = pairs.filter(p => p.ownerEmail === me.email);
        const lists = await Promise.all(mine.map(p => db.getPlaylistById(p.id)));

        if (!lists || lists.length === 0) {
        return res.status(404).json({ success: false, error: 'Playlists not found' });
        }
        return res.status(200).json({ success: true, data: lists });
    } catch (err) {
        console.error(err);
        return res.status(400).json({ success: false, error: err.message || String(err) });
    }
}

updatePlaylist = async (req, res) => {
    if(auth.verifyUser(req) === null){
        return res.status(400).json({
            errorMessage: 'UNAUTHORIZED'
        })
    }
    const body = req.body
    console.log("updatePlaylist: " + JSON.stringify(body));
    console.log("body.playlist.name:", body?.playlist?.name);

    if (!body) {
        return res.status(400).json({
            success: false,
            error: 'You must provide a body to update',
        })
    }

    const db = req.app.locals.db;
    // Prefer route param, but guard against "undefined"
    let playlistId = req.params?.id;
    if (!playlistId || playlistId === 'undefined') {
        playlistId = body?.playlist?.id || body?.playlist?._id;
    }
    
    if (!playlistId) {
        return res.status(400).json({ message: 'Missing playlist id' });
    }
    
    const current = await db.getPlaylistById(playlistId);
    if (!current) return res.status(404).json({ message: 'Playlist not found!' });

    const me = await db.findUserById(req.userId);
    if (!me || me.email !== current.ownerEmail) {
        return res.status(400).json({ success: false, description: 'authentication error' });
    }
    const updated = await db.updatePlaylistById(playlistId, body.playlist);
    return res.status(200).json({ success: true, id: updated.id, message: 'Playlist updated!' });
}

module.exports = {
    createPlaylist,
    deletePlaylist,
    getPlaylistById,
    getPlaylistPairs,
    getPlaylists,
    updatePlaylist
}