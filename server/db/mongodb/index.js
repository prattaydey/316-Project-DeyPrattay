const DatabaseManager = require('../DatabaseManager');
const mongoose = require('mongoose');
const User = require('../../models/user-model');
const Playlist = require('../../models/playlist-model');
const Song = require('../../models/song-model');

class MongoDatabaseManager extends DatabaseManager {
    async init() {
        const uri = process.env.DB_CONNECT;
        await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    }
    async dispose() { await mongoose.connection.close(); }

    // users
    async createUser({ firstName, lastName, userName, email, passwordHash, avatarImage }) {
        const doc = await User.create({ 
            firstName, 
            lastName, 
            userName, 
            email, 
            passwordHash, 
            avatarImage,
            playlists: [] 
        });
        return { 
            id: doc._id.toString(), 
            firstName: doc.firstName, 
            lastName: doc.lastName,
            userName: doc.userName,
            email: doc.email,
            avatarImage: doc.avatarImage
        };
    }
    async findUserByEmail(email) {
        const doc = await User.findOne({ email }).exec();
        if (!doc) return null;
        return { 
            id: doc._id.toString(), 
            firstName: doc.firstName, 
            lastName: doc.lastName,
            userName: doc.userName,
            email: doc.email, 
            passwordHash: doc.passwordHash,
            avatarImage: doc.avatarImage
        };
    }

    async findUserById(id) {
        const doc = await User.findById(id).lean();
        if (!doc) return null;
        return {
            id: doc._id.toString(),
            firstName: doc.firstName,
            lastName: doc.lastName,
            userName: doc.userName,
            email: doc.email,
            avatarImage: doc.avatarImage
        };
    }

    async updateUserById(id, userPatch) {
        const doc = await User.findByIdAndUpdate(id, { $set: userPatch }, { new: true }).exec();
        if (!doc) return null;
        return {
            id: doc._id.toString(),
            firstName: doc.firstName,
            lastName: doc.lastName,
            userName: doc.userName,
            email: doc.email,
            avatarImage: doc.avatarImage
        };
    }

    // playlists
    async createPlaylist({ name, ownerEmail, ownerName, songs, published }) {
        const doc = await Playlist.create({ 
            name, 
            ownerEmail, 
            ownerName,
            songs: songs || [],
            published: published || false,
            listens: 0,
            listeners: [],
            likes: 0,
            dislikes: 0,
            comments: [],
            createdDate: new Date(),
            lastEditedDate: new Date()
        });
        return this.#toPlaylist(doc);
    }
    async getPlaylistById(id) {
        const doc = await Playlist.findById(id).exec();
        return doc ? this.#toPlaylist(doc) : null;
    }
    async getPlaylistPairs() {
        const docs = await Playlist.find({}, { name: 1, ownerEmail: 1, ownerName: 1, published: 1 }).exec();
        return docs.map(d => ({ 
            id: d._id.toString(), 
            name: d.name, 
            ownerEmail: d.ownerEmail,
            ownerName: d.ownerName,
            published: d.published
        }));
    }
    async updatePlaylistById(id, playlistPatch) {
        const doc = await Playlist.findByIdAndUpdate(id, { $set: playlistPatch }, { new: true }).exec();
        return doc ? this.#toPlaylist(doc) : null;
    }
    async deletePlaylistById(id) {
        const res = await Playlist.findByIdAndDelete(id).exec();
        return !!res;
    }

    // songs
    async createSong({ title, artist, year, youTubeId, addedBy, addedByName }) {
        try {
            const doc = await Song.create({ 
                title, 
                artist, 
                year, 
                youTubeId, 
                addedBy, 
                addedByName,
                listens: 0,
                playlistCount: 0,
                createdDate: new Date()
            });
            return this.#toSong(doc);
        } catch (err) {
            // Handle duplicate key error (E11000)
            if (err.code === 11000) {
                throw new Error('A song with this title, artist, and year already exists');
            }
            throw err;
        }
    }

    async getSongById(id) {
        const doc = await Song.findById(id).exec();
        return doc ? this.#toSong(doc) : null;
    }

    async getAllSongs() {
        const docs = await Song.find({}).exec();
        return docs.map(d => this.#toSong(d));
    }

    async findSongByTitleArtistYear(title, artist, year) {
        const doc = await Song.findOne({ title, artist, year }).exec();
        return doc ? this.#toSong(doc) : null;
    }

    async updateSongById(id, songPatch) {
        const doc = await Song.findByIdAndUpdate(id, { $set: songPatch }, { new: true }).exec();
        return doc ? this.#toSong(doc) : null;
    }

    async deleteSongById(id) {
        const res = await Song.findByIdAndDelete(id).exec();
        return !!res;
    }

    async searchSongs(query) {
        const { title, artist, addedBy, sortBy, sortOrder } = query;
        let filter = {};
        
        if (title) {
            filter.title = { $regex: title, $options: 'i' };
        }
        if (artist) {
            filter.artist = { $regex: artist, $options: 'i' };
        }
        if (addedBy) {
            filter.addedBy = addedBy;
        }

        let sortOptions = {};
        if (sortBy) {
            sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;
        }

        const docs = await Song.find(filter).sort(sortOptions).exec();
        return docs.map(d => this.#toSong(d));
    }

    #toPlaylist(doc) {
        return {
            id: doc._id.toString(),
            name: doc.name,
            ownerEmail: doc.ownerEmail,
            ownerName: doc.ownerName,
            songs: doc.songs?.map(s => ({
                title: s.title, 
                artist: s.artist, 
                year: s.year, 
                youTubeId: s.youTubeId
            })) || [],
            published: doc.published,
            listens: doc.listens,
            listeners: doc.listeners || [],
            likes: doc.likes,
            dislikes: doc.dislikes,
            comments: doc.comments || [],
            createdDate: doc.createdDate,
            lastEditedDate: doc.lastEditedDate
        };
    }

    #toSong(doc) {
        return {
            id: doc._id.toString(),
            title: doc.title,
            artist: doc.artist,
            year: doc.year,
            youTubeId: doc.youTubeId,
            addedBy: doc.addedBy,
            addedByName: doc.addedByName,
            listens: doc.listens,
            playlistCount: doc.playlistCount,
            createdDate: doc.createdDate
        };
    }
}

module.exports = MongoDatabaseManager;