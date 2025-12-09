const dotenv = require('dotenv').config({ path: __dirname + '/../../../.env' });
const bcrypt = require('bcryptjs');

async function clearCollection(collection, collectionName) {
    try {
        await collection.deleteMany({});
        console.log(collectionName + " cleared");
    }
    catch (err) {
        console.log(err);
    }
}

async function resetMongo() {
    const Playlist = require('../../../models/playlist-model')
    const User = require("../../../models/user-model")
    const Song = require("../../../models/song-model")
    const testData = require("../PlaylisterData.json")

    console.log("Resetting MongoDB with PlaylisterData");
    // Clear all collections
    await clearCollection(User, "User");
    await clearCollection(Playlist, "Playlist");
    await clearCollection(Song, "Song");
    
    // Create default password for all test users
    const defaultPassword = "password123";
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    const passwordHash = await bcrypt.hash(defaultPassword, salt);
    
    // Create users with new schema
    console.log("\nCreating users...");
    const userMap = {}; // Map email to userName
    
    for (const userData of testData.users) {
        try {
            const user = new User({
                userName: userData.name,
                email: userData.email,
                passwordHash: passwordHash,
                avatarImage: null,
                playlists: []
            });
            await user.save();
            userMap[userData.email] = userData.name;
            console.log(`Created user: ${userData.name} (${userData.email})`);
        } catch (err) {
            console.log(`Failed to create user ${userData.email}:`, err.message);
        }
    }
    
    // Create playlists with new schema
    console.log("\nCreating playlists...");
    let playlistSuccessCount = 0;
    let playlistFailCount = 0;
    
    // Track songs for the global catalog using map
    // Key: "title|artist|year" -> { song data, addedBy, addedByName, playlistCount }
    const songCatalog = new Map();
    
    for (const playlistData of testData.playlists) {
        try {
            const ownerName = userMap[playlistData.ownerEmail];
            if (!ownerName) {
                console.log(`Skipping playlist "${playlistData.name}": owner ${playlistData.ownerEmail} not found`);
                playlistFailCount++;
                continue;
            }
            
            const playlist = new Playlist({
                name: playlistData.name,
                ownerEmail: playlistData.ownerEmail,
                ownerName: ownerName,
                songs: playlistData.songs || [],
                published: false, // Start unpublished
                listens: 0,
                uniqueListeners: [],
                createdDate: new Date(),
                lastEditedDate: new Date()
            });
            await playlist.save();
            playlistSuccessCount++;
            
            // Add songs to the catalog tracker
            for (const song of (playlistData.songs || [])) {
                if (song.title && song.artist && song.year && song.youTubeId) {
                    const key = `${song.title}|${song.artist}|${song.year}`;
                    if (songCatalog.has(key)) {
                        // Song already exists, increment playlist count
                        songCatalog.get(key).playlistCount++;
                    } else {
                        // New song, add to catalog
                        songCatalog.set(key, {
                            title: song.title,
                            artist: song.artist,
                            year: song.year,
                            youTubeId: song.youTubeId,
                            addedBy: playlistData.ownerEmail,
                            addedByName: ownerName,
                            playlistCount: 1
                        });
                    }
                }
            }
            
            console.log(`Created playlist: "${playlistData.name}" by ${ownerName} (${playlistData.songs?.length || 0} songs)`);
        } catch (err) {
            playlistFailCount++;
            console.log(`Failed to create playlist "${playlistData.name}":`, err.message);
        }
    }
    
    // Now create all unique songs in the global Song catalog
    console.log("\nPopulating global song catalog...");
    let songSuccessCount = 0;
    let songFailCount = 0;
    
    for (const [key, songData] of songCatalog) {
        try {
            const song = new Song({
                title: songData.title,
                artist: songData.artist,
                year: songData.year,
                youTubeId: songData.youTubeId,
                addedBy: songData.addedBy,
                addedByName: songData.addedByName,
                listens: 0,
                playlistCount: songData.playlistCount,
                createdDate: new Date()
            });
            await song.save();
            songSuccessCount++;
        } catch (err) {
            songFailCount++;
            // Only log if it's not a duplicate error (shouldn't happen with our Map)
            if (err.code !== 11000) {
                console.log(`Failed to create song "${songData.title}":`, err.message);
            }
        }
    }
    
    console.log(`Songs added to catalog: ${songSuccessCount}`);
    if (songFailCount > 0) {
        console.log(`Songs failed: ${songFailCount}`);
    }
    
    console.log("\n" + "=".repeat(60));
    console.log("DATA LOAD COMPLETE");
    console.log(`Users created: ${Object.keys(userMap).length}`);
    console.log(`Playlists created: ${playlistSuccessCount}`);
    console.log(`Playlists failed: ${playlistFailCount}`);
    console.log(`Unique songs in catalog: ${songSuccessCount}`);
}

const mongoose = require('mongoose')
mongoose
    .connect(process.env.DB_CONNECT, { useNewUrlParser: true })
    .then(() => { resetMongo() })
    .catch(e => {
        console.error('Connection error', e.message)
    })


