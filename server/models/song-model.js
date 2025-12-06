const mongoose = require('mongoose')
const Schema = mongoose.Schema

/*
    This is the schema for the global Song catalog.
    Songs are added by users and can be used in multiple playlists.
    No two songs can have the same (title, artist, year) combination.
*/
const songSchema = new Schema(
    {
        title: { type: String, required: true },
        artist: { type: String, required: true },
        year: { type: Number, required: true },
        youTubeId: { type: String, required: true },
        addedBy: { type: String, required: true }, // User email who added it
        addedByName: { type: String, required: true }, // User name for display
        listens: { type: Number, default: 0 },
        playlistCount: { type: Number, default: 0 }, // How many playlists use this song
        createdDate: { type: Date, default: Date.now }
    },
    { timestamps: true }
)

// Create a unique compound index on title, artist, and year
// This ensures no duplicate songs can exist
songSchema.index({ title: 1, artist: 1, year: 1 }, { unique: true })

module.exports = mongoose.model('Song', songSchema)

