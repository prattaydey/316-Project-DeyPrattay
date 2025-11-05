const DatabaseManager = require('../DatabaseManager');
const { Sequelize, DataTypes } = require('sequelize');

class PostgresDatabaseManager extends DatabaseManager {
    async init() {
        const uri = process.env.PG_URI; // postgres URI when using Postgres
        this.sequelize = new Sequelize(uri, { dialect: 'postgres', logging: false });

        // define models
        this.User = this.sequelize.define('User', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        firstName: DataTypes.STRING, lastName: DataTypes.STRING,
        email: { type: DataTypes.STRING, unique: true }, passwordHash: DataTypes.STRING
        }, { tableName: 'users', timestamps: true });

        this.Playlist = this.sequelize.define('Playlist', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        name: DataTypes.STRING, ownerEmail: DataTypes.STRING
        }, { tableName: 'playlists', timestamps: true });

        this.Song = this.sequelize.define('Song', {
        id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        title: DataTypes.STRING, artist: DataTypes.STRING, year: DataTypes.INTEGER, youTubeId: DataTypes.STRING
        }, { tableName: 'songs', timestamps: true });

        this.Playlist.hasMany(this.Song, { foreignKey: 'playlistId', onDelete: 'CASCADE' });
        this.Song.belongsTo(this.Playlist, { foreignKey: 'playlistId' });

        await this.sequelize.authenticate();
        await this.sequelize.sync();
    }

    async dispose() { if (this.sequelize) await this.sequelize.close(); }

    // users
    async createUser({ firstName, lastName, email, passwordHash }) {
        const u = await this.User.create({ firstName, lastName, email, passwordHash });
        return { id: u.id, firstName: u.firstName, lastName: u.lastName, email: u.email };
    }
    async findUserByEmail(email) {
        const u = await this.User.findOne({ where: { email } });
        if (!u) return null;
        return { id: u.id, firstName: u.firstName, lastName: u.lastName, email: u.email, passwordHash: u.passwordHash };
    }

    async findUserById(id) {
        return this.User.findByPk(id);
    }


    // playlists
    async createPlaylist({ name, ownerEmail, songs }) {
        const p = await this.Playlist.create({ name, ownerEmail });
        if (Array.isArray(songs) && songs.length) {
        await this.Song.bulkCreate(songs.map(s => ({ ...s, playlistId: p.id })));
        }
        return this.#toPlaylist(await this.Playlist.findByPk(p.id, { include: this.Song }));
    }
    async getPlaylistById(id) {
        const p = await this.Playlist.findByPk(id, { include: this.Song });
        return p ? this.#toPlaylist(p) : null;
    }
    async getPlaylistPairs() {
        const rows = await this.Playlist.findAll({ attributes: ['id','name','ownerEmail'] });
        return rows.map(r => ({ id: r.id, name: r.name, ownerEmail: r.ownerEmail }));
    }
    async updatePlaylistById(id, playlistPatch) {
        const p = await this.Playlist.findByPk(id);
        if (!p) return null;
        if (playlistPatch.name !== undefined) p.name = playlistPatch.name;
        if (playlistPatch.ownerEmail !== undefined) p.ownerEmail = playlistPatch.ownerEmail;
        await p.save();

        if (Array.isArray(playlistPatch.songs)) {
            // replace all songs for simplicity
            await this.Song.destroy({ where: { playlistId: p.id } });
            await this.Song.bulkCreate(playlistPatch.songs.map(s => ({ ...s, playlistId: p.id })));
        }
        const withSongs = await this.Playlist.findByPk(p.id, { include: this.Song });
        return this.#toPlaylist(withSongs);
    }
    async deletePlaylistById(id) {
        const n = await this.Playlist.destroy({ where: { id } });
        return n > 0;
    }

    #toPlaylist(row) {
        const rawSongs = Array.isArray(row?.Songs) ? row.Songs
                       : Array.isArray(row?.songs) ? row.songs
                       : [];
        return {
            id: row.id,
            _id: String(row.id),
            name: row.name,
            ownerEmail: row.ownerEmail,
            songs: rawSongs.map(s => ({
                title: s.title, artist: s.artist, year: s.year, youTubeId: s.youTubeId
            }))
        };
    }
}

module.exports = PostgresDatabaseManager;