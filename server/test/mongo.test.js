import { beforeAll, afterAll, describe, expect, test } from 'vitest';
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const mongoose = require('mongoose');
const MongoDatabaseManager = require('../db/mongodb');

/**
 * Vitest tests for MongoDB Database Manager - Core CRUD Operations
 */

let db;
let testUserId;
let testPlaylistId;
let testSongId;

const TEST_USER = {
    firstName: 'Test',
    lastName: 'User',
    userName: 'TestUser123',
    email: `test_${Date.now()}@example.com`,
    passwordHash: '$2b$10$hashedpassword123456789',
    avatarImage: null
};

const TEST_PLAYLIST = {
    name: 'Test Playlist',
    songs: [
        { title: 'Test Song 1', artist: 'Test Artist', year: 2023, youTubeId: 'abc123' },
        { title: 'Test Song 2', artist: 'Test Artist 2', year: 2024, youTubeId: 'def456' }
    ],
    published: false
};

const TEST_SONG = {
    title: `Test Catalog Song ${Date.now()}`,
    artist: 'Test Artist',
    year: 2024,
    youTubeId: 'xyz789'
};

beforeAll(async () => {
    db = new MongoDatabaseManager();
    await db.init();
});

afterAll(async () => {
    if (testSongId) try { await db.deleteSongById(testSongId); } catch (e) {}
    if (testPlaylistId) try { await db.deletePlaylistById(testPlaylistId); } catch (e) {}
    await db.dispose();
});

// USER TESTS 
describe('User Operations', () => {
    
    test('Create User - returns user with correct fields, no passwordHash exposed', async () => {
        const user = await db.createUser(TEST_USER);
        testUserId = user.id;
        
        expect(user).toHaveProperty('id');
        expect(user.userName).toBe(TEST_USER.userName);
        expect(user.email).toBe(TEST_USER.email);
        expect(user).not.toHaveProperty('passwordHash');
    });

    test('Find User by Email - returns user with passwordHash for auth', async () => {
        const user = await db.findUserByEmail(TEST_USER.email);
        
        expect(user).not.toBeNull();
        expect(user.email).toBe(TEST_USER.email);
        expect(user).toHaveProperty('passwordHash');
        expect(user.passwordHash).toBe(TEST_USER.passwordHash);
    });

    test('Update User - successfully updates fields', async () => {
        const updated = await db.updateUserById(testUserId, { userName: 'UpdatedName' });
        
        expect(updated).not.toBeNull();
        expect(updated.userName).toBe('UpdatedName');
        expect(updated.email).toBe(TEST_USER.email);
    });
});

// PLAYLIST TESTS
describe('Playlist Operations', () => {
    
    test('Create Playlist - returns playlist with all required fields', async () => {
        const playlist = await db.createPlaylist({
            ...TEST_PLAYLIST,
            ownerEmail: TEST_USER.email,
            ownerName: TEST_USER.userName
        });
        testPlaylistId = playlist.id;
        
        expect(playlist).toHaveProperty('id');
        expect(playlist.name).toBe(TEST_PLAYLIST.name);
        expect(playlist.ownerEmail).toBe(TEST_USER.email);
        expect(playlist.published).toBe(false);
        expect(playlist.listens).toBe(0);
        expect(Array.isArray(playlist.songs)).toBe(true);
        expect(playlist.songs).toHaveLength(2);
    });

    test('Get Playlist by ID - returns correct playlist', async () => {
        const playlist = await db.getPlaylistById(testPlaylistId);
        
        expect(playlist).not.toBeNull();
        expect(playlist.id).toBe(testPlaylistId);
        expect(playlist.name).toBe(TEST_PLAYLIST.name);
    });

    test('Update Playlist - successfully updates name, songs, published', async () => {
        const newSong = { title: 'New Song', artist: 'New Artist', year: 2025, youTubeId: 'new123' };
        const updated = await db.updatePlaylistById(testPlaylistId, {
            name: 'Updated Playlist',
            songs: [...TEST_PLAYLIST.songs, newSong],
            published: true
        });
        
        expect(updated.name).toBe('Updated Playlist');
        expect(updated.songs).toHaveLength(3);
        expect(updated.published).toBe(true);
    });

    test('Delete Playlist - deletes and returns true, verify removal', async () => {
        const temp = await db.createPlaylist({
            name: 'Temp', ownerEmail: TEST_USER.email, ownerName: TEST_USER.userName, songs: []
        });
        
        const result = await db.deletePlaylistById(temp.id);
        expect(result).toBe(true);
        
        const deleted = await db.getPlaylistById(temp.id);
        expect(deleted).toBeNull();
    });
});

// SONG TESTS
describe('Song Operations', () => {
    
    test('Create Song - returns song with all required fields', async () => {
        const song = await db.createSong({
            ...TEST_SONG,
            addedBy: TEST_USER.email,
            addedByName: TEST_USER.userName
        });
        testSongId = song.id;
        
        expect(song).toHaveProperty('id');
        expect(song.title).toBe(TEST_SONG.title);
        expect(song.addedBy).toBe(TEST_USER.email);
        expect(song.listens).toBe(0);
        expect(song.playlistCount).toBe(0);
    });

    test('Create Song - throws error for duplicate (title, artist, year)', async () => {
        await expect(db.createSong({
            ...TEST_SONG,
            addedBy: TEST_USER.email,
            addedByName: TEST_USER.userName
        })).rejects.toThrow('A song with this title, artist, and year already exists');
    });

    test('Get Song by ID - returns correct song', async () => {
        const song = await db.getSongById(testSongId);
        
        expect(song).not.toBeNull();
        expect(song.id).toBe(testSongId);
        expect(song.title).toBe(TEST_SONG.title);
    });

    test('Search Songs - filters by title (case-insensitive)', async () => {
        const results = await db.searchSongs({ title: 'catalog song' });
        
        expect(Array.isArray(results)).toBe(true);
        const found = results.some(s => s.id === testSongId);
        expect(found).toBe(true);
    });

    test('Update Song - successfully updates listens and playlistCount', async () => {
        const updated = await db.updateSongById(testSongId, { listens: 100, playlistCount: 5 });
        
        expect(updated.listens).toBe(100);
        expect(updated.playlistCount).toBe(5);
        expect(updated.title).toBe(TEST_SONG.title);
    });

    test('Delete Song - deletes and returns true, verify removal', async () => {
        const temp = await db.createSong({
            title: `Temp ${Date.now()}`, artist: 'Temp', year: 1999, youTubeId: 'temp',
            addedBy: TEST_USER.email, addedByName: TEST_USER.userName
        });
        
        const result = await db.deleteSongById(temp.id);
        expect(result).toBe(true);
        
        const deleted = await db.getSongById(temp.id);
        expect(deleted).toBeNull();
    });

    test('Delete Song - returns false for non-existent ID', async () => {
        const fakeId = new mongoose.Types.ObjectId().toString();
        const result = await db.deleteSongById(fakeId);
        
        expect(result).toBe(false);
    });
});
