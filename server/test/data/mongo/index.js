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
    let successCount = 0;
    let failCount = 0;
    
    for (const playlistData of testData.playlists) {
        try {
            const ownerName = userMap[playlistData.ownerEmail];
            if (!ownerName) {
                console.log(`Skipping playlist "${playlistData.name}": owner ${playlistData.ownerEmail} not found`);
                failCount++;
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
                comments: [],
                createdDate: new Date(),
                lastEditedDate: new Date()
            });
            await playlist.save();
            successCount++;
            console.log(`Created playlist: "${playlistData.name}" by ${ownerName} (${playlistData.songs?.length || 0} songs)`);
        } catch (err) {
            failCount++;
            console.log(`Failed to create playlist "${playlistData.name}":`, err.message);
        }
    }
    
    console.log("\n" + "=".repeat(60));
    console.log("DATA LOAD COMPLETE");
    console.log(`Users created: ${Object.keys(userMap).length}`);
    console.log(`Playlists created: ${successCount}`);
    console.log(`Playlists failed: ${failCount}`);
}

const mongoose = require('mongoose')
mongoose
    .connect(process.env.DB_CONNECT, { useNewUrlParser: true })
    .then(() => { resetMongo() })
    .catch(e => {
        console.error('Connection error', e.message)
    })


