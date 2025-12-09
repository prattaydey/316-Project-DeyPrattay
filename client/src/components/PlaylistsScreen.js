import { useContext, useEffect, useState } from 'react'
import { GlobalStoreContext } from '../store'
import AuthContext from '../auth'
import PlaylistCard from './PlaylistCard'
import PlayPlaylistModal from './PlayPlaylistModal'
import MUIDeleteModal from './MUIDeleteModal'
import ClearIcon from '@mui/icons-material/Clear';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';

const PlaylistsScreen = () => {
    const { store } = useContext(GlobalStoreContext);
    const { auth } = useContext(AuthContext);
    
    // Search state
    const [searchName, setSearchName] = useState('');
    const [searchUser, setSearchUser] = useState('');
    const [searchSongTitle, setSearchSongTitle] = useState('');
    const [searchSongArtist, setSearchSongArtist] = useState('');
    const [searchSongYear, setSearchSongYear] = useState('');
    
    // Sort state
    const [sortBy, setSortBy] = useState('listens');
    const [sortOrder, setSortOrder] = useState('desc');
    
    // Playlists data
    const [playlists, setPlaylists] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Modal states
    const [playingPlaylist, setPlayingPlaylist] = useState(null);

    // Load playlists on mount and when sort changes
    useEffect(() => {
        loadPlaylists();
    }, [sortBy, sortOrder]);

    const loadPlaylists = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (searchName) params.append('name', searchName);
            if (searchUser) params.append('ownerName', searchUser);
            if (searchSongTitle) params.append('songTitle', searchSongTitle);
            if (searchSongArtist) params.append('songArtist', searchSongArtist);
            if (searchSongYear) params.append('songYear', searchSongYear);
            params.append('sortBy', sortBy);
            params.append('sortOrder', sortOrder);
            
            // If logged in with no search criteria, show user's playlists
            // Otherwise show all published playlists
            if (auth.loggedIn && !searchUser) {
                params.append('view', 'home');
            } else if (searchUser) {
                params.append('view', 'user');
            } else {
                params.append('view', 'all');
            }
            
            const response = await fetch(`http://localhost:4000/store/playlists?${params.toString()}`, {
                credentials: 'include'
            });
            const data = await response.json();
            if (data.success) {
                setPlaylists(data.playlists);
            }
        } catch (error) {
            console.error('Error loading playlists:', error);
        }
        setLoading(false);
    };

    const handleSearch = () => {
        loadPlaylists();
    };

    const handleClearSearch = () => {
        setSearchName('');
        setSearchUser('');
        setSearchSongTitle('');
        setSearchSongArtist('');
        setSearchSongYear('');
        loadPlaylists();
    };

    const handleSortChange = (event) => {
        const value = event.target.value;
        const [field, order] = value.split('-');
        setSortBy(field);
        setSortOrder(order);
    };

    const handleCreatePlaylist = async () => {
        if (!auth.loggedIn) return;
        
        try {
            const response = await fetch('http://localhost:4000/store/playlist', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    name: 'Untitled Playlist',
                    songs: []
                })
            });
            
            if (response.ok) {
                loadPlaylists();
            }
        } catch (error) {
            console.error('Error creating playlist:', error);
        }
    };

    const handlePlayPlaylist = (playlist) => {
        setPlayingPlaylist(playlist);
    };

    const handleCopyPlaylist = async (playlistId) => {
        try {
            const response = await fetch(`http://localhost:4000/store/playlist/${playlistId}/copy`, {
                method: 'POST',
                credentials: 'include'
            });
            
            if (response.ok) {
                loadPlaylists();
            }
        } catch (error) {
            console.error('Error copying playlist:', error);
        }
    };

    const handleDeletePlaylist = async (playlistId) => {
        if (window.confirm('Are you sure you want to delete this playlist?')) {
            try {
                const response = await fetch(`http://localhost:4000/store/playlist/${playlistId}`, {
                    method: 'DELETE',
                    credentials: 'include'
                });
                
                if (response.ok) {
                    loadPlaylists();
                }
            } catch (error) {
                console.error('Error deleting playlist:', error);
            }
        }
    };

    const isOwnPlaylist = (playlist) => {
        return auth.loggedIn && auth.user && playlist.ownerEmail === auth.user.email;
    };

    const getSortValue = () => `${sortBy}-${sortOrder}`;

    return (
        <div id="playlists-screen">
            <div id="playlists-content">
                {/* Left Panel - Search */}
                <div className="playlists-left">
                    <h1 className="playlists-title">Playlists</h1>
                    
                    {/* Search Fields */}
                    <div className="search-fields">
                        <div className="search-input-group">
                            <input
                                type="text"
                                placeholder="by Playlist Name"
                                value={searchName}
                                onChange={(e) => setSearchName(e.target.value)}
                            />
                            <button className="clear-btn" onClick={() => setSearchName('')}>
                                <ClearIcon sx={{ fontSize: 16 }} />
                            </button>
                        </div>
                        
                        <div className="search-input-group">
                            <input
                                type="text"
                                placeholder="by User Name"
                                value={searchUser}
                                onChange={(e) => setSearchUser(e.target.value)}
                            />
                            <button className="clear-btn" onClick={() => setSearchUser('')}>
                                <ClearIcon sx={{ fontSize: 16 }} />
                            </button>
                        </div>
                        
                        <div className="search-input-group">
                            <input
                                type="text"
                                placeholder="by Song Title"
                                value={searchSongTitle}
                                onChange={(e) => setSearchSongTitle(e.target.value)}
                            />
                            <button className="clear-btn" onClick={() => setSearchSongTitle('')}>
                                <ClearIcon sx={{ fontSize: 16 }} />
                            </button>
                        </div>
                        
                        <div className="search-input-group">
                            <input
                                type="text"
                                placeholder="by Song Artist"
                                value={searchSongArtist}
                                onChange={(e) => setSearchSongArtist(e.target.value)}
                            />
                            <button className="clear-btn" onClick={() => setSearchSongArtist('')}>
                                <ClearIcon sx={{ fontSize: 16 }} />
                            </button>
                        </div>
                        
                        <div className="search-input-group">
                            <input
                                type="text"
                                placeholder="by Song Year"
                                value={searchSongYear}
                                onChange={(e) => setSearchSongYear(e.target.value)}
                            />
                            <button className="clear-btn" onClick={() => setSearchSongYear('')}>
                                <ClearIcon sx={{ fontSize: 16 }} />
                            </button>
                        </div>
                    </div>
                    
                    {/* Search Buttons */}
                    <div className="search-buttons">
                        <Button
                            variant="contained"
                            startIcon={<SearchIcon />}
                            onClick={handleSearch}
                            sx={{
                                backgroundColor: '#5c4d7d',
                                borderRadius: '20px',
                                textTransform: 'none',
                                '&:hover': { backgroundColor: '#7b68a6' }
                            }}
                        >
                            Search
                        </Button>
                        <Button
                            variant="contained"
                            onClick={handleClearSearch}
                            sx={{
                                backgroundColor: '#5c4d7d',
                                borderRadius: '20px',
                                textTransform: 'none',
                                '&:hover': { backgroundColor: '#7b68a6' }
                            }}
                        >
                            Clear
                        </Button>
                    </div>
                </div>
                
                {/* Right Panel - Sort and Playlist List */}
                <div className="playlists-right">
                    {/* Sort Header */}
                    <div className="playlists-header">
                        <div className="sort-controls">
                            <span>Sort:</span>
                            <Select
                                value={getSortValue()}
                                onChange={handleSortChange}
                                size="small"
                                sx={{
                                    color: '#7b68a6',
                                    '.MuiOutlinedInput-notchedOutline': { border: 'none' },
                                    '.MuiSelect-select': { py: 0.5 }
                                }}
                            >
                                <MenuItem value="listens-desc">Listeners (Hi-Lo)</MenuItem>
                                <MenuItem value="listens-asc">Listeners (Lo-Hi)</MenuItem>
                                <MenuItem value="name-asc">Name (A-Z)</MenuItem>
                                <MenuItem value="name-desc">Name (Z-A)</MenuItem>
                                <MenuItem value="ownerName-asc">Owner (A-Z)</MenuItem>
                                <MenuItem value="ownerName-desc">Owner (Z-A)</MenuItem>
                                <MenuItem value="lastEditedDate-desc">Last Edited (New-Old)</MenuItem>
                                <MenuItem value="lastEditedDate-asc">Last Edited (Old-New)</MenuItem>
                            </Select>
                        </div>
                        <span className="playlist-count">
                            {playlists.length} Playlist{playlists.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                    
                    {/* Playlist List */}
                    <div className="playlists-list">
                        {loading ? (
                            <div className="loading">Loading playlists...</div>
                        ) : playlists.length === 0 ? (
                            <div className="no-playlists">No playlists found</div>
                        ) : (
                            playlists.map((playlist) => (
                                <PlaylistCard
                                    key={playlist.id}
                                    playlist={playlist}
                                    isOwner={isOwnPlaylist(playlist)}
                                    onPlay={() => handlePlayPlaylist(playlist)}
                                    onCopy={() => handleCopyPlaylist(playlist.id)}
                                    onDelete={() => handleDeletePlaylist(playlist.id)}
                                    onRefresh={loadPlaylists}
                                />
                            ))
                        )}
                    </div>
                    
                    {/* New Playlist Button - only for logged in users */}
                    {auth.loggedIn && (
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={handleCreatePlaylist}
                            sx={{
                                backgroundColor: '#5c4d7d',
                                borderRadius: '20px',
                                textTransform: 'none',
                                mt: 2,
                                '&:hover': { backgroundColor: '#7b68a6' }
                            }}
                        >
                            New Playlist
                        </Button>
                    )}
                </div>
            </div>
            
            {/* Play Playlist Modal */}
            {playingPlaylist && (
                <PlayPlaylistModal
                    playlist={playingPlaylist}
                    onClose={() => setPlayingPlaylist(null)}
                />
            )}
            
            <MUIDeleteModal />
        </div>
    )
}

export default PlaylistsScreen;
