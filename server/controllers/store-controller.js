const auth = require('../auth')
/*
    This is our back-end API. It provides all the data services
    our database needs. Note that this file contains the controller
    functions for each endpoint.
    
    @author McKilla Gorilla
*/
createPlaylist = async (req, res) => {
    // req.userId is set by auth.verify middleware
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
        const user = await db.findUserById(req.userId);
        
        if (!user) {
            return res.status(400).json({
                errorMessage: 'User not found'
            })
        }

        const playlist = await db.createPlaylist({
            name: body.name || 'Untitled',
            ownerEmail: user.email,
            ownerName: user.userName,
            songs: Array.isArray(body.songs) ? body.songs : [],
            published: body.published || false
        });
        return res.status(201).json({ success: true, playlist });
    } catch (err) {
        console.log("err: " + err);
        return res.status(400).json({
            errorMessage: 'Playlist not created!',
            error: err
        })
    }
}

deletePlaylist = async (req, res) => {
    // req.userId is set by auth.verify middleware
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
    const userId = auth.verifyUser(req);
    if(!userId){
        return res.status(400).json({
            errorMessage: 'UNAUTHORIZED'
        })
    }
    console.log("Find Playlist with id: " + JSON.stringify(req.params.id));
    const db = req.app.locals.db;
    const list = await db.getPlaylistById(req.params.id);
    if (!list) return res.status(400).json({ success: false, error: 'Playlist not found' });
    const me = await db.findUserById(userId);
    if (!me || me.email !== list.ownerEmail) {
        return res.status(400).json({ success: false, description: 'authentication error' });
    }
    return res.status(200).json({ success: true, playlist: list });
}

getPlaylistPairs = async (req, res) => {
    // req.userId is set by auth.verify middleware
    console.log("getPlaylistPairs");
    const db = req.app.locals.db;
    const me = await db.findUserById(req.userId);
    const pairs = (await db.getPlaylistPairs()).filter(p => p.ownerEmail === me.email)
                    .map(p => ({ _id: p.id, name: p.name }));
    return res.status(200).json({ success: true, idNamePairs: pairs });
}

getPlaylists = async (req, res) => {
    // Allow both logged-in users and guests to view published playlists
    const userId = auth.verifyUser(req);
    
    try {
        const db = req.app.locals.db;
        const { 
            view, 
            name, 
            ownerName, 
            songTitle, 
            songArtist, 
            songYear, 
            sortBy, 
            sortOrder 
        } = req.query;
        
        let user = null;
        if (userId) {
            user = await db.findUserById(userId);
        }

        // Get all playlists
        const pairs = await db.getPlaylistPairs();
        let lists = await Promise.all(pairs.map(p => db.getPlaylistById(p.id)));

        // Filter by view type
        if (view === 'home' && user) {
            // User's own playlists (published and unpublished)
            lists = lists.filter(p => p.ownerEmail === user.email);
        } else if (view === 'user' && ownerName) {
            // Playlists by specific user (only published, unless it's the current user)
            lists = lists.filter(p => {
                const matchesOwner = p.ownerName.toLowerCase().includes(ownerName.toLowerCase());
                const isOwnPlaylist = user && p.ownerEmail === user.email;
                return matchesOwner && (p.published || isOwnPlaylist);
            });
        } else if (view === 'all' || !user) {
            // All published playlists (for guests or "all" view)
            lists = lists.filter(p => p.published);
        } else {
            // Default for logged-in user: their own playlists
            lists = lists.filter(p => p.ownerEmail === user.email);
        }

        // Search by playlist name
        if (name) {
            lists = lists.filter(p => 
                p.name.toLowerCase().includes(name.toLowerCase())
            );
        }

        // Search by owner name (if not already filtered by view=user)
        if (ownerName && view !== 'user') {
            lists = lists.filter(p => 
                p.ownerName.toLowerCase().includes(ownerName.toLowerCase())
            );
        }

        // Filter by song title
        if (songTitle) {
            lists = lists.filter(p => 
                p.songs && p.songs.some(s => 
                    s.title && s.title.toLowerCase().includes(songTitle.toLowerCase())
                )
            );
        }

        // Filter by song artist
        if (songArtist) {
            lists = lists.filter(p => 
                p.songs && p.songs.some(s => 
                    s.artist && s.artist.toLowerCase().includes(songArtist.toLowerCase())
                )
            );
        }

        // Filter by song year
        if (songYear) {
            const yearNum = parseInt(songYear);
            if (!isNaN(yearNum)) {
                lists = lists.filter(p => 
                    p.songs && p.songs.some(s => s.year === yearNum)
                );
            }
        }

        // Sort playlists
        if (sortBy) {
            lists.sort((a, b) => {
                let comparison = 0;
                
                switch (sortBy) {
                    case 'listens':
                        comparison = (b.listens || 0) - (a.listens || 0);
                        break;
                    case 'name':
                        comparison = a.name.localeCompare(b.name);
                        break;
                    case 'ownerName':
                        comparison = a.ownerName.localeCompare(b.ownerName);
                        break;
                    case 'createdDate':
                        comparison = new Date(b.createdDate) - new Date(a.createdDate);
                        break;
                    case 'lastEditedDate':
                        comparison = new Date(b.lastEditedDate) - new Date(a.lastEditedDate);
                        break;
                    default:
                        break;
                }
                
                // Reverse if sortOrder is 'asc'
                return sortOrder === 'asc' ? -comparison : comparison;
            });
        }

        return res.status(200).json({ success: true, playlists: lists });
    } catch (err) {
        console.error(err);
        return res.status(400).json({ success: false, error: err.message || String(err) });
    }
}

updatePlaylist = async (req, res) => {
    // req.userId is set by auth.verify middleware
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

// PUBLISH/UNPUBLISH a playlist
publishPlaylist = async (req, res) => {
    // req.userId is set by auth.verify middleware
    try {
        const db = req.app.locals.db;
        const playlistId = req.params.id;
        const { published } = req.body;
        
        const playlist = await db.getPlaylistById(playlistId);
        if (!playlist) {
            return res.status(404).json({ errorMessage: 'Playlist not found!' });
        }
        
        const user = await db.findUserById(req.userId);
        if (!user || user.email !== playlist.ownerEmail) {
            return res.status(403).json({ errorMessage: 'You can only publish your own playlists' });
        }
        
        const updated = await db.updatePlaylistById(playlistId, { published });
        return res.status(200).json({ success: true, playlist: updated });
    } catch (err) {
        console.error(err);
        return res.status(400).json({ success: false, error: err.message || String(err) });
    }
}

// PLAY a playlist (track listens and listeners)
playPlaylist = async (req, res) => {
    // Allow both logged-in and guest users to play
    const userId = auth.verifyUser(req);
    
    try {
        const db = req.app.locals.db;
        const playlistId = req.params.id;
        
        const playlist = await db.getPlaylistById(playlistId);
        if (!playlist) {
            return res.status(404).json({ errorMessage: 'Playlist not found!' });
        }
        
        // Increment listens
        const newListens = (playlist.listens || 0) + 1;
        let newUniqueListeners = playlist.uniqueListeners || [];
        
        // Add to unique listeners if user is logged in and not already in the list
        if (userId && !newUniqueListeners.includes(userId)) {
            newUniqueListeners = [...newUniqueListeners, userId];
        }
        
        const updated = await db.updatePlaylistById(playlistId, { 
            listens: newListens,
            uniqueListeners: newUniqueListeners
        });
        
        return res.status(200).json({ success: true, playlist: updated });
    } catch (err) {
        console.error(err);
        return res.status(400).json({ success: false, error: err.message || String(err) });
    }
}

// COPY a playlist
copyPlaylist = async (req, res) => {
    // req.userId is set by auth.verify middleware
    try {
        const db = req.app.locals.db;
        const playlistId = req.params.id;
        
        const originalPlaylist = await db.getPlaylistById(playlistId);
        if (!originalPlaylist) {
            return res.status(404).json({ errorMessage: 'Playlist not found!' });
        }
        
        // Can only copy published playlists or your own
        const user = await db.findUserById(req.userId);
        if (!originalPlaylist.published && originalPlaylist.ownerEmail !== user.email) {
            return res.status(403).json({ 
                errorMessage: 'You can only copy published playlists or your own playlists' 
            });
        }
        
        // Create a copy with new owner
        const copiedPlaylist = await db.createPlaylist({
            name: `${originalPlaylist.name} (Copy)`,
            ownerEmail: user.email,
            ownerName: user.userName,
            songs: [...originalPlaylist.songs],
            published: false // Copies start as unpublished
        });
        
        return res.status(201).json({ success: true, playlist: copiedPlaylist });
    } catch (err) {
        console.error(err);
        return res.status(400).json({ success: false, error: err.message || String(err) });
    }
}

module.exports = {
    createPlaylist,
    deletePlaylist,
    getPlaylistById,
    getPlaylistPairs,
    getPlaylists,
    updatePlaylist,
    publishPlaylist,
    playPlaylist,
    copyPlaylist
}