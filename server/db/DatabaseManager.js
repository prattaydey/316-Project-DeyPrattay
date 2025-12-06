class DatabaseManager {
  async init() { throw new Error('init() not implemented'); }
  async dispose() {}

  /* users */
  async createUser({ firstName, lastName, userName, email, passwordHash, avatarImage }) { throw new Error('createUser() not implemented'); }
  async findUserByEmail(email) { throw new Error('findUserByEmail() not implemented'); }
  async findUserById(id) { throw new Error('findUserById() not implemented'); }
  async updateUserById(id, userPatch) { throw new Error('updateUserById() not implemented'); }

  /* playlists */
  async createPlaylist({ name, ownerEmail, ownerName, songs, published }) { throw new Error('createPlaylist() not implemented'); }
  async getPlaylistById(id) { throw new Error('getPlaylistById() not implemented'); }
  async getPlaylistPairs() { throw new Error('getPlaylistPairs() not implemented'); } 
  async updatePlaylistById(id, playlistPatch) { throw new Error('updatePlaylistById() not implemented'); }
  async deletePlaylistById(id) { throw new Error('deletePlaylistById() not implemented'); }

  /* songs */
  async createSong({ title, artist, year, youTubeId, addedBy, addedByName }) { throw new Error('createSong() not implemented'); }
  async getSongById(id) { throw new Error('getSongById() not implemented'); }
  async getAllSongs() { throw new Error('getAllSongs() not implemented'); }
  async findSongByTitleArtistYear(title, artist, year) { throw new Error('findSongByTitleArtistYear() not implemented'); }
  async updateSongById(id, songPatch) { throw new Error('updateSongById() not implemented'); }
  async deleteSongById(id) { throw new Error('deleteSongById() not implemented'); }
  async searchSongs(query) { throw new Error('searchSongs() not implemented'); }
}

module.exports = DatabaseManager;