const auth = require('../auth')

/*
    This is our back-end API for the global Song catalog.
    It provides all the data services for managing songs.
*/

// CREATE a new song in the global catalog
createSong = async (req, res) => {
    const userId = auth.verifyUser(req);
    if (!userId) {
        return res.status(400).json({
            errorMessage: 'UNAUTHORIZED'
        })
    }
    
    const body = req.body;
    console.log("createSong body: " + JSON.stringify(body));
    
    if (!body) {
        return res.status(400).json({
            success: false,
            error: 'You must provide a Song',
        })
    }

    // Validate required fields
    if (!body.title || !body.artist || !body.year || !body.youTubeId) {
        return res.status(400).json({
            success: false,
            error: 'Title, artist, year, and YouTube ID are required'
        })
    }

    try {
        const db = req.app.locals.db;
        const user = await db.findUserById(userId);
        
        if (!user) {
            return res.status(400).json({
                errorMessage: 'User not found'
            })
        }

        // Check if song already exists with same title, artist, year
        const existing = await db.findSongByTitleArtistYear(body.title, body.artist, body.year);
        if (existing) {
            return res.status(400).json({
                success: false,
                errorMessage: 'A song with this title, artist, and year already exists in the catalog'
            })
        }

        const song = await db.createSong({
            title: body.title,
            artist: body.artist,
            year: body.year,
            youTubeId: body.youTubeId,
            addedBy: user.email,
            addedByName: user.userName
        });
        
        return res.status(201).json({ success: true, song });
    } catch (err) {
        console.log("err: " + err);
        return res.status(400).json({
            errorMessage: 'Song not created!',
            error: err.message || String(err)
        })
    }
}

// GET all songs or search/filter songs
getSongs = async (req, res) => {
    // Allow both logged-in users and guests to view songs
    // But we'll check auth to show ownership info
    const userId = auth.verifyUser(req);
    
    console.log("getSongs with query: " + JSON.stringify(req.query));
    
    try {
        const db = req.app.locals.db;
        const { title, artist, addedBy, sortBy, sortOrder } = req.query;
        
        let songs;
        
        // If any filters are provided, use search
        if (title || artist || addedBy || sortBy) {
            songs = await db.searchSongs({
                title,
                artist,
                addedBy,
                sortBy: sortBy || 'createdDate',
                sortOrder: sortOrder || 'desc'
            });
        } else {
            // Get all songs
            songs = await db.getAllSongs();
        }
        
        // Add flag for if current user added each song
        let currentUserEmail = null;
        if (userId) {
            const user = await db.findUserById(userId);
            currentUserEmail = user?.email;
        }
        
        const songsWithOwnership = songs.map(song => ({
            ...song,
            isOwnedByCurrentUser: currentUserEmail && song.addedBy === currentUserEmail
        }));
        
        return res.status(200).json({ 
            success: true, 
            songs: songsWithOwnership 
        });
    } catch (err) {
        console.error(err);
        return res.status(400).json({ 
            success: false, 
            error: err.message || String(err) 
        });
    }
}

// GET a single song by ID
getSongById = async (req, res) => {
    console.log("Find Song with id: " + JSON.stringify(req.params.id));
    
    try {
        const db = req.app.locals.db;
        const song = await db.getSongById(req.params.id);
        
        if (!song) {
            return res.status(404).json({ 
                success: false, 
                error: 'Song not found' 
            });
        }
        
        return res.status(200).json({ success: true, song });
    } catch (err) {
        console.error(err);
        return res.status(400).json({ 
            success: false, 
            error: err.message || String(err) 
        });
    }
}

// UPDATE a song (only by the user who added it)
updateSong = async (req, res) => {
    const userId = auth.verifyUser(req);
    if (!userId) {
        return res.status(400).json({
            errorMessage: 'UNAUTHORIZED'
        })
    }
    
    const body = req.body;
    console.log("updateSong: " + JSON.stringify(body));

    if (!body) {
        return res.status(400).json({
            success: false,
            error: 'You must provide a body to update',
        })
    }

    try {
        const db = req.app.locals.db;
        const songId = req.params.id;
        
        if (!songId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing song id' 
            });
        }
        
        const currentSong = await db.getSongById(songId);
        if (!currentSong) {
            return res.status(404).json({ 
                success: false, 
                message: 'Song not found!' 
            });
        }

        const user = await db.findUserById(userId);
        if (!user || user.email !== currentSong.addedBy) {
            return res.status(403).json({ 
                success: false, 
                errorMessage: 'You can only edit songs you added to the catalog' 
            });
        }

        // Check if the update would create a duplicate
        if (body.title || body.artist || body.year) {
            const checkTitle = body.title || currentSong.title;
            const checkArtist = body.artist || currentSong.artist;
            const checkYear = body.year || currentSong.year;
            
            const existing = await db.findSongByTitleArtistYear(checkTitle, checkArtist, checkYear);
            if (existing && existing.id !== songId) {
                return res.status(400).json({
                    success: false,
                    errorMessage: 'A song with this title, artist, and year already exists'
                });
            }
        }

        const updated = await db.updateSongById(songId, body);
        return res.status(200).json({ 
            success: true, 
            song: updated, 
            message: 'Song updated!' 
        });
    } catch (err) {
        console.error(err);
        return res.status(400).json({
            success: false,
            error: err.message || String(err)
        });
    }
}

// DELETE a song from catalog (only by the user who added it)
deleteSong = async (req, res) => {
    const userId = auth.verifyUser(req);
    if (!userId) {
        return res.status(400).json({
            errorMessage: 'UNAUTHORIZED'
        })
    }
    
    console.log("delete Song with id: " + JSON.stringify(req.params.id));
    
    try {
        const db = req.app.locals.db;
        const song = await db.getSongById(req.params.id);
        
        if (!song) {
            return res.status(404).json({ 
                success: false, 
                errorMessage: 'Song not found!' 
            });
        }
        
        const user = await db.findUserById(userId);
        if (!user || user.email !== song.addedBy) {
            return res.status(403).json({ 
                success: false, 
                errorMessage: 'You can only remove songs you added to the catalog' 
            });
        }
        
        const ok = await db.deleteSongById(req.params.id);
        return res.status(ok ? 200 : 404).json(
            ok ? { success: true, message: 'Song removed from catalog' } 
               : { success: false, errorMessage: 'Song not found!' }
        );
    } catch (err) {
        console.error(err);
        return res.status(400).json({
            success: false,
            error: err.message || String(err)
        });
    }
}

module.exports = {
    createSong,
    getSongs,
    getSongById,
    updateSong,
    deleteSong
}
