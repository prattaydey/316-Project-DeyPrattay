const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

const { Sequelize, DataTypes } = require('sequelize');
const testData = require('../example-db-data.json');                                                                                                                                                                                                

// Connect
const sequelize = new Sequelize(process.env.PG_URI, {
    dialect: 'postgres',
    logging: false
});

// Define models
const User = sequelize.define('User', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    firstName: { type: DataTypes.STRING, allowNull: false },
    lastName:  { type: DataTypes.STRING, allowNull: false },
    email:     { type: DataTypes.STRING, allowNull: false, unique: true },
    passwordHash: { type: DataTypes.STRING, allowNull: false }
    }, { tableName: 'users', timestamps: true });

const Playlist = sequelize.define('Playlist', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    // Keep a copy of the Mongo _id so we can map users.playlists[] from JSON
    mongo_id: { type: DataTypes.STRING(48), allowNull: true, unique: true },
    name: { type: DataTypes.STRING, allowNull: false },
    ownerEmail: { type: DataTypes.STRING, allowNull: false }
    }, { tableName: 'playlists', timestamps: true });

const Song = sequelize.define('Song', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    title: { type: DataTypes.STRING, allowNull: false },
    artist: { type: DataTypes.STRING, allowNull: true },
    year: { type: DataTypes.INTEGER, allowNull: true },
    youTubeId: { type: DataTypes.STRING, allowNull: true }
    }, { tableName: 'songs', timestamps: true });

// Join table to mirror users.playlists [] ObjectIds from JSON
const UserPlaylist = sequelize.define('UserPlaylist', {
}, { tableName: 'user_playlists', timestamps: false });

// Relations
Playlist.hasMany(Song, { foreignKey: 'playlistId', onDelete: 'CASCADE' });
Song.belongsTo(Playlist, { foreignKey: 'playlistId' });

User.belongsToMany(Playlist, { through: UserPlaylist, foreignKey: 'userId', otherKey: 'playlistId' });
Playlist.belongsToMany(User, { through: UserPlaylist, foreignKey: 'playlistId', otherKey: 'userId' });

async function resetPostgre() {
    console.log('Resetting the PostgreSQL DB with Sequelize');

    // Drop and recreate everything
    await sequelize.sync({ force: true });

    // Insert users
    const users = await User.bulkCreate(
        testData.users.map(u => ({
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        passwordHash: u.passwordHash
        })),
        { returning: true }
    );

    // Build quick maps
    const emailToUser = new Map(users.map(u => [u.email, u]));
    // Insert playlists and songs
    // We preserve the Mongo `_id` as mongo_id so we can connect users.playlists later
    const playlistRows = [];
    for (const pl of testData.playlists) {
        const row = await Playlist.create({
        mongo_id: pl._id || null,
        name: pl.name,
        ownerEmail: pl.ownerEmail
        });

        if (Array.isArray(pl.songs) && pl.songs.length) {
        const songsPayload = pl.songs.map(s => ({
            title: s.title,
            artist: s.artist || null,
            year: typeof s.year === 'number' ? s.year : null,
            youTubeId: s.youTubeId || null,
            playlistId: row.id
        }));
        await Song.bulkCreate(songsPayload);
        }
        playlistRows.push(row);
    }

    const mongoIdToPlaylist = new Map(
        playlistRows.filter(p => p.mongo_id).map(p => [p.mongo_id, p])
    );

    // Mirror users.playlists [] 
    for (const u of testData.users) {
        const userRow = emailToUser.get(u.email);
        if (!userRow || !Array.isArray(u.playlists) || u.playlists.length === 0) continue;

        const playlistIds = [];
        for (const mongoId of u.playlists) {
        const plRow = mongoIdToPlaylist.get(mongoId);
        if (plRow) playlistIds.push(plRow.id);
        }
        if (playlistIds.length) {
        await userRow.addPlaylists(playlistIds);
        }
    }
    console.log('PostgreSQL reset complete');
}

sequelize.authenticate()
    .then(() => resetPostgre())
    .then(() => sequelize.close())
    .catch(err => {
        console.error('Postgre reset error:', err);
        sequelize.close();
    });