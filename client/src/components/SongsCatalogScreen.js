import { useContext, useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import AuthContext from '../auth';
import { GlobalStoreContext } from '../store';
import SongCatalogCard from './SongCatalogCard';
import MUIAddSongModal from './MUIAddSongModal';  
import MUIEditCatalogSongModal from './MUIEditCatalogSongModal';
import ClearIcon from '@mui/icons-material/Clear';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';

export default function SongsCatalogScreen() {
    const { auth } = useContext(AuthContext);
    const { store } = useContext(GlobalStoreContext);
    const history = useHistory();
    
    // Search 
    const [searchTitle, setSearchTitle] = useState('');
    const [searchArtist, setSearchArtist] = useState('');
    const [searchYear, setSearchYear] = useState('');
    
    // Sort
    const [sortBy, setSortBy] = useState('listens');
    const [sortOrder, setSortOrder] = useState('desc');
    
    const [songs, setSongs] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Selected song for YouTube player
    const [selectedSong, setSelectedSong] = useState(null);
    
    // modals
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingSong, setEditingSong] = useState(null);

    // Load songs on mount and when search/sort changes
    useEffect(() => {
        loadSongs();
    }, [sortBy, sortOrder]);

    const loadSongs = async (isSearch = false) => {
        setLoading(true);
        
        // Check if any search filter is applied
        const hasSearchFilter = searchTitle || searchArtist || searchYear;
        
        // If guest with no search filters, show empty list (no owned songs)
        if (!auth.loggedIn && !hasSearchFilter && !isSearch) {
            setSongs([]);
            setSelectedSong(null);
            setLoading(false);
            return;
        }
        
        try {
            const params = new URLSearchParams();
            
            // If searching, search the full catalog
            // If not searching and logged in, show only user's own songs
            if (hasSearchFilter || isSearch) {
                // Search mode - search full catalog
                if (searchTitle) params.append('title', searchTitle);
                if (searchArtist) params.append('artist', searchArtist);
                if (searchYear) params.append('year', searchYear);
            } else if (auth.loggedIn && auth.user) {
                // No search, logged in - show only own songs
                params.append('addedBy', auth.user.email);
            }
            
            params.append('sortBy', sortBy);
            params.append('sortOrder', sortOrder);
            
            const response = await fetch(`http://localhost:4000/songs?${params.toString()}`, {
                credentials: 'include'
            });
            const data = await response.json();
            if (data.success) {
                setSongs(data.songs);
                // select first song for player if none selected
                if (data.songs.length > 0 && !selectedSong) {
                    setSelectedSong(data.songs[0]);
                }
            }
        } catch (error) {
            console.error('Error loading songs:', error);
        }
        setLoading(false);
    };

    const handleSearch = () => {
        loadSongs(true); // true = is a search, search full catalog
    };

    const handleClearSearch = () => {
        setSearchTitle('');
        setSearchArtist('');
        setSearchYear('');
        setTimeout(() => loadSongs(false), 0);
    };

    const handleSortChange = (event) => {
        const value = event.target.value;
        // parse sort value ("listens-desc" -> sortBy: "listens", sortOrder: "desc")
        const [field, order] = value.split('-');
        setSortBy(field);
        setSortOrder(order);
    };

    const handleSongSelect = (song) => {
        // Only increment if selecting a different song
        const isDifferentSong = !selectedSong || selectedSong.id !== song.id;
        
        // Always update selected song immediately
        setSelectedSong(song);
        
        // Increment listen count: fire and forget - don't block UI)
        if (isDifferentSong) {
            fetch(`http://localhost:4000/songs/${song.id}/play`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include'
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    setSongs(prevSongs => 
                        prevSongs.map(s => 
                            s.id === song.id 
                                ? { ...s, listens: data.listens } 
                                : s
                        )
                    );
                }
            })
            .catch(error => {
                console.error('Error recording listen:', error);
            });
        }
    };

    const handleEditSong = (song) => {
        setEditingSong(song);
    };

    const handleDeleteSong = async (songId) => {
        try {
            const response = await fetch(`http://localhost:4000/songs/${songId}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            if (response.ok) {
                loadSongs();
            }
        } catch (error) {
            console.error('Error deleting song:', error);
        }
    };

    const handleAddToPlaylist = async (songId, playlistId) => {
        // I STILL NEED TO IMPLEMENT THIS LATER
        console.log('Adding song', songId, 'to playlist', playlistId);
    };

    const getSortValue = () => `${sortBy}-${sortOrder}`;

    const isOwnSong = (song) => {
        return auth.loggedIn && auth.user && song.addedBy === auth.user.email;
    };

    return (
        <div id="songs-catalog-screen">
            <div id="songs-catalog-content">
                {/* Left Panel - Search and Player */}
                <div className="songs-catalog-left">
                    <h1 className="songs-catalog-title">Songs Catalog</h1>
                    
                    {/* Search Fields */}
                    <div className="search-fields">
                        <div className="search-input-group">
                            <input
                                type="text"
                                placeholder="by Title"
                                value={searchTitle}
                                onChange={(e) => setSearchTitle(e.target.value)}
                            />
                            <button className="clear-btn" onClick={() => setSearchTitle('')}>
                                <ClearIcon sx={{ fontSize: 16 }} />
                            </button>
                        </div>
                        
                        <div className="search-input-group">
                            <input
                                type="text"
                                placeholder="by Artist"
                                value={searchArtist}
                                onChange={(e) => setSearchArtist(e.target.value)}
                            />
                            <button className="clear-btn" onClick={() => setSearchArtist('')}>
                                <ClearIcon sx={{ fontSize: 16 }} />
                            </button>
                        </div>
                        
                        <div className="search-input-group">
                            <input
                                type="text"
                                placeholder="by Year"
                                value={searchYear}
                                onChange={(e) => setSearchYear(e.target.value)}
                            />
                            <button className="clear-btn" onClick={() => setSearchYear('')}>
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
                        {(searchTitle || searchArtist || searchYear) && (
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
                        )}
                    </div>
                    
                    {/* YouTube Player */}
                    <div className="youtube-player">
                        {selectedSong ? (
                            <iframe
                                width="100%"
                                height="100%"
                                src={`https://www.youtube.com/embed/${selectedSong.youTubeId}`}
                                title="YouTube video player"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        ) : (
                            <div className="no-song-selected">
                                Select a song to play
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Right Panel - Sort and Song List */}
                <div className="songs-catalog-right">
                    {/* Sort Header */}
                    <div className="songs-catalog-header">
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
                                <MenuItem value="listens-desc">Listens (Hi-Lo)</MenuItem>
                                <MenuItem value="listens-asc">Listens (Lo-Hi)</MenuItem>
                                <MenuItem value="playlistCount-desc">Playlists (Hi-Lo)</MenuItem>
                                <MenuItem value="playlistCount-asc">Playlists (Lo-Hi)</MenuItem>
                                <MenuItem value="title-asc">Title (A-Z)</MenuItem>
                                <MenuItem value="title-desc">Title (Z-A)</MenuItem>
                                <MenuItem value="artist-asc">Artist (A-Z)</MenuItem>
                                <MenuItem value="artist-desc">Artist (Z-A)</MenuItem>
                                <MenuItem value="year-desc">Year (New-Old)</MenuItem>
                                <MenuItem value="year-asc">Year (Old-New)</MenuItem>
                            </Select>
                        </div>
                        <span className="song-count">{songs.length} Songs</span>
                    </div>
                    
                    {/* Song List */}
                    <div className="songs-list">
                        {loading ? (
                            <div className="loading">Loading songs...</div>
                        ) : songs.length === 0 ? (
                            <div className="no-songs">
                                {!auth.loggedIn && !searchTitle && !searchArtist && !searchYear
                                    ? "Use the search to browse the song catalog"
                                    : auth.loggedIn && !searchTitle && !searchArtist && !searchYear
                                    ? "You haven't added any songs yet. Click 'New Song' to add one!"
                                    : "No songs found matching your search"}
                            </div>
                        ) : (
                            songs.map((song) => (
                                <SongCatalogCard
                                    key={song.id}
                                    song={song}
                                    isOwner={isOwnSong(song)}
                                    isSelected={selectedSong && selectedSong.id === song.id}
                                    onSelect={() => handleSongSelect(song)}
                                    onEdit={() => handleEditSong(song)}
                                    onDelete={() => handleDeleteSong(song.id)}
                                    onAddToPlaylist={handleAddToPlaylist}
                                />
                            ))
                        )}
                    </div>
                    
                    {/* New Song Button - only for logged in users */}
                    {auth.loggedIn && (
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => setShowAddModal(true)}
                            sx={{
                                backgroundColor: '#e040fb',
                                borderRadius: '20px',
                                textTransform: 'none',
                                mt: 2,
                                '&:hover': { backgroundColor: '#d81be0' }
                            }}
                        >
                            New Song
                        </Button>
                    )}
                </div>
            </div>
            
            {/* Add Song Modal */}
            {showAddModal && (
                <MUIAddSongModal
                    onClose={() => setShowAddModal(false)}
                    onSongAdded={() => {
                        setShowAddModal(false);
                        loadSongs();
                    }}
                />
            )}
            
            {/* Edit Song Modal */}
            {editingSong && (
                <MUIEditCatalogSongModal
                    song={editingSong}
                    onClose={() => setEditingSong(null)}
                    onSongUpdated={() => {
                        setEditingSong(null);
                        loadSongs();
                    }}
                />
            )}
        </div>
    );
}

