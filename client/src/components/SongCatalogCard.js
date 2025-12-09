import { useContext, useState, useEffect } from 'react';
import AuthContext from '../auth';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ArrowRightIcon from '@mui/icons-material/ArrowRight';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';

export default function SongCatalogCard({ 
    song, 
    isOwner, 
    isSelected, 
    onSelect, 
    onEdit, 
    onDelete, 
    onAddToPlaylist 
}) {
    const { auth } = useContext(AuthContext);
    const [anchorEl, setAnchorEl] = useState(null);
    const [playlistMenuAnchor, setPlaylistMenuAnchor] = useState(null);
    const [userPlaylists, setUserPlaylists] = useState([]);
    const isMenuOpen = Boolean(anchorEl);
    const isPlaylistMenuOpen = Boolean(playlistMenuAnchor);

    // Fetch user's playlists when main menu opens
    useEffect(() => {
        if (isMenuOpen && auth.loggedIn) {
            fetchUserPlaylists();
        }
    }, [isMenuOpen, auth.loggedIn]);

    const fetchUserPlaylists = async () => {
        try {
            console.log('Fetching user playlists...');
            const response = await fetch('http://localhost:4000/store/playlists?view=home&sortBy=lastEditedDate&sortOrder=desc', {
                credentials: 'include'
            });
            const data = await response.json();
            console.log('Playlists fetched:', data);
            if (data.success) {
                setUserPlaylists(data.playlists || []);
            }
        } catch (error) {
            console.error('Error fetching playlists:', error);
        }
    };

    const handleMenuOpen = (event) => {
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setPlaylistMenuAnchor(null);
    };

    const handleAddToPlaylistClick = (event) => {
        event.stopPropagation();
        setPlaylistMenuAnchor(event.currentTarget);
    };

    const handlePlaylistMenuClose = () => {
        setPlaylistMenuAnchor(null);
    };

    const handlePlaylistSelect = async (playlistId, playlistName) => {
        console.log('Adding song to playlist:', playlistId);
        try {
            // First get the playlist
            const getResponse = await fetch(`http://localhost:4000/store/playlist/${playlistId}`, {
                credentials: 'include'
            });
            const getData = await getResponse.json();
            console.log('Got playlist data:', getData);
            
            if (getData.success) {
                const playlist = getData.playlist;
                const newSong = {
                    title: song.title,
                    artist: song.artist,
                    year: song.year,
                    youTubeId: song.youTubeId
                };
                
                // Add the song to the playlist's songs array
                const updatedSongs = [...(playlist.songs || []), newSong];
                
                // Update the playlist
                const updateResponse = await fetch(`http://localhost:4000/store/playlist/${playlistId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        playlist: {
                            songs: updatedSongs
                        }
                    })
                });
                
                console.log('Update response:', updateResponse.status);
                
                if (updateResponse.ok) {
                    if (onAddToPlaylist) {
                        onAddToPlaylist(song.id, playlistId);
                    }
                    alert(`Added "${song.title}" to "${playlistName}"!`);
                } else {
                    alert('Failed to add song to playlist');
                }
            }
        } catch (error) {
            console.error('Error adding song to playlist:', error);
            alert('Error adding song to playlist');
        }
        handleMenuClose();
    };

    const handleEdit = () => {
        onEdit();
        handleMenuClose();
    };

    const handleDelete = () => {
        if (window.confirm(`Are you sure you want to remove "${song.title}" from the catalog?`)) {
            onDelete();
        }
        handleMenuClose();
    };

    return (
        <div 
            className={`song-catalog-card ${isSelected ? 'selected' : ''} ${isOwner ? 'owned' : ''}`}
            onClick={onSelect}
        >
            <div className="song-catalog-info">
                <div className="song-catalog-title">
                    {song.title} by {song.artist} ({song.year})
                </div>
                <div className="song-catalog-stats">
                    <span>Listens: {song.listens?.toLocaleString() || 0}</span>
                    <span>Playlists: {song.playlistCount || 0}</span>
                </div>
            </div>
            
            {/* Menu Button - only show for logged in users */}
            {auth.loggedIn && (
                <IconButton
                    onClick={handleMenuOpen}
                    size="small"
                    sx={{ color: '#333' }}
                >
                    <MoreVertIcon />
                </IconButton>
            )}
            
            {/* Main Song Menu */}
            <Menu
                anchorEl={anchorEl}
                open={isMenuOpen}
                onClose={handleMenuClose}
                anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                }}
            >
                <MenuItem 
                    onClick={handleAddToPlaylistClick}
                    sx={{ display: 'flex', justifyContent: 'space-between' }}
                >
                    Add to Playlist
                    <ArrowRightIcon sx={{ ml: 1 }} />
                </MenuItem>
                {isOwner && (
                    <MenuItem 
                        onClick={handleEdit}
                        sx={{ backgroundColor: '#e1bee7' }}
                    >
                        Edit Song
                    </MenuItem>
                )}
                {isOwner && (
                    <MenuItem onClick={handleDelete}>
                        Remove from Catalog
                    </MenuItem>
                )}
            </Menu>

            {/* Playlist Submenu */}
            <Menu
                anchorEl={playlistMenuAnchor}
                open={isPlaylistMenuOpen}
                onClose={handlePlaylistMenuClose}
                anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'left',
                }}
                sx={{
                    '& .MuiPaper-root': {
                        backgroundColor: '#ef9a9a',
                        minWidth: '150px'
                    }
                }}
            >
                {userPlaylists.length === 0 ? (
                    <MenuItem disabled sx={{ fontStyle: 'italic', color: '#666' }}>
                        No playlists available
                    </MenuItem>
                ) : (
                    userPlaylists.map((playlist) => (
                        <MenuItem
                            key={playlist.id}
                            onClick={(e) => {
                                e.stopPropagation();
                                handlePlaylistSelect(playlist.id, playlist.name);
                            }}
                            sx={{
                                borderBottom: '1px solid #333',
                                '&:last-child': { borderBottom: 'none' },
                                '&:hover': { backgroundColor: '#e57373' }
                            }}
                        >
                            {playlist.name}
                        </MenuItem>
                    ))
                )}
            </Menu>
        </div>
    );
}
