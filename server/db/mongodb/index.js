const DatabaseManager = require('../DatabaseManager');
const mongoose = require('mongoose');
const User = require('../../models/user-model');
const Playlist = require('../../models/playlist-model');

class MongoDatabaseManager extends DatabaseManager {
    async init() {
        const uri = process.env.DB_CONNECT;
        await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    }
    async dispose() { await mongoose.connection.close(); }

    // users
    async createUser({ firstName, lastName, email, passwordHash }) {
        const doc = await User.create({ firstName, lastName, email, passwordHash, playlists: [] });
        return { id: doc._id.toString(), firstName: doc.firstName, lastName: doc.lastName, email: doc.email };
    }
    async findUserByEmail(email) {
        const doc = await User.findOne({ email }).exec();
        if (!doc) return null;
        return { id: doc._id.toString(), firstName: doc.firstName, lastName: doc.lastName, email: doc.email, passwordHash: doc.passwordHash };
    }

    // playlists
    async createPlaylist({ name, ownerEmail, songs }) {
        const doc = await Playlist.create({ name, ownerEmail, songs });
        return this.#toPlaylist(doc);
    }
    async getPlaylistById(id) {
        const doc = await Playlist.findById(id).exec();
        return doc ? this.#toPlaylist(doc) : null;
    }
    async getPlaylistPairs() {
        const docs = await Playlist.find({}, { name: 1, ownerEmail: 1 }).exec();
        return docs.map(d => ({ id: d._id.toString(), name: d.name, ownerEmail: d.ownerEmail }));
    }
    async updatePlaylistById(id, playlistPatch) {
        const doc = await Playlist.findByIdAndUpdate(id, { $set: playlistPatch }, { new: true }).exec();
        return doc ? this.#toPlaylist(doc) : null;
    }
    async deletePlaylistById(id) {
        const res = await Playlist.findByIdAndDelete(id).exec();
        return !!res;
    }

    #toPlaylist(doc) {
        return {
        id: doc._id.toString(),
        name: doc.name,
        ownerEmail: doc.ownerEmail,
        songs: doc.songs?.map(s => ({
            title: s.title, artist: s.artist, year: s.year, youTubeId: s.youTubeId
        })) || []
        };
    }
}

module.exports = MongoDatabaseManager;