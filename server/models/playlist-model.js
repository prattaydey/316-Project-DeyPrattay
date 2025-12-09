const mongoose = require('mongoose')
const Schema = mongoose.Schema
/*
    This is where we specify the format of the data we're going to put into
    the database.
    
    @author McKilla Gorilla
*/
const playlistSchema = new Schema(
    {
        name: { type: String, required: true },
        ownerEmail: { type: String, required: true },
        ownerName: { type: String, required: true },
        songs: { type: [{
            title: String,
            artist: String,
            year: Number,
            youTubeId: String
        }], required: true },
        published: { type: Boolean, default: false },
        listens: { type: Number, default: 0 },
        uniqueListeners: [{ type: String }],
        createdDate: { type: Date, default: Date.now },
        lastEditedDate: { type: Date, default: Date.now }
    },
    { timestamps: true },
)

module.exports = mongoose.model('Playlist', playlistSchema)
