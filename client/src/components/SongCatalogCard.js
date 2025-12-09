import { useContext, useState, useEffect } from 'react';
import AuthContext from '../auth';
import MoreVertIcon from '@mui/icons-material/MoreVert';
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
    const [playlistSubmenuAnchor, setPlaylistSubmenuAnchor] = useState(null);
    const [userPlaylists, setUserPlaylists] = useState([]);
    const isMenuOpen = Boolean(anchorEl);

    // Fetch user's playlists when menu opens
    useEffect(() => {
        if (isMenuOpen && auth.loggedIn) {
            fetchUserPlaylists();
        }
    }, [isMenuOpen, auth.loggedIn]);

    const fetchUserPlaylists = async () => {
        try {
            const response = await fetch('http://localhost:4000/store/playlists?view=home&sortBy=lastEditedDate&sortOrder=desc', {
                credentials: 'include'
            });
            const data = await response.json();
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
        setPlaylistSubmenuAnchor(null);
    };

    const handleAddToPlaylistHover = (event) => {
        setPlaylistSubmenuAnchor(event.currentTarget);
    };

    const handleAddToPlaylistLeave = () => {
        setPlaylistSubmenuAnchor(null);
    };

    const handlePlaylistSelect = async (playlistId) => {
        // Add song to the selected playlist
        try {
            // First get the playlist
            const getResponse = await fetch(`http://localhost:4000/store/playlist/${playlistId}`, {
                credentials: 'include'
            });
            const getData = await getResponse.json();
            
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
                
                if (updateResponse.ok) {
                    if (onAddToPlaylist) {
                        onAddToPlaylist(song.id, playlistId);
                    }
                    alert(`Added "${song.title}" to playlist!`);
                }
            }
        } catch (error) {
            console.error('Error adding song to playlist:', error);
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
            
            {/* Song Menu */}
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
                    onMouseEnter={handleAddToPlaylistHover}
                    onMouseLeave={handleAddToPlaylistLeave}
                    sx={{ position: 'relative' }}
                >
                    Add to Playlist
                    {/* Submenu for playlists */}
                    {playlistSubmenuAnchor && (
                        <div 
                            className="playlist-submenu"
                            onMouseEnter={() => setPlaylistSubmenuAnchor(playlistSubmenuAnchor)}
                            onMouseLeave={handleAddToPlaylistLeave}
                        >
                            {userPlaylists.length === 0 ? (
                                <div className="playlist-submenu-empty">
                                    No playlists available
                                </div>
                            ) : (
                                userPlaylists.map((playlist) => (
                                    <div
                                        key={playlist.id}
                                        className="playlist-submenu-item"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handlePlaylistSelect(playlist.id);
                                        }}
                                    >
                                        {playlist.name}
                                    </div>
                                ))
                            )}
                        </div>
                    )}
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
        </div>
    );
}
