class DatabaseManager {
  async init() { throw new Error('init() not implemented'); }
  async dispose() {}

  /* users */
  async createUser({ firstName, lastName, email, passwordHash }) { throw new Error('createUser() not implemented'); }
  async findUserByEmail(email) { throw new Error('findUserByEmail() not implemented'); }

  /* playlists */
  async createPlaylist({ name, ownerEmail, songs }) { throw new Error('createPlaylist() not implemented'); }
  async getPlaylistById(id) { throw new Error('getPlaylistById() not implemented'); }
  async getPlaylistPairs() { throw new Error('getPlaylistPairs() not implemented'); } 
  async updatePlaylistById(id, playlistPatch) { throw new Error('updatePlaylistById() not implemented'); }
  async deletePlaylistById(id) { throw new Error('deletePlaylistById() not implemented'); }
}

module.exports = DatabaseManager;