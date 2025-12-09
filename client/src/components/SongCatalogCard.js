import { useContext, useState } from 'react';
import AuthContext from '../auth';
import { GlobalStoreContext } from '../store';
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
    const { store } = useContext(GlobalStoreContext);
    const [anchorEl, setAnchorEl] = useState(null);
    const [playlistMenuAnchor, setPlaylistMenuAnchor] = useState(null);
    const isMenuOpen = Boolean(anchorEl);

    const handleMenuOpen = (event) => {
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setPlaylistMenuAnchor(null);
    };

    const handleAddToPlaylistHover = (event) => {
        setPlaylistMenuAnchor(event.currentTarget);
    };

    const handlePlaylistSelect = (playlistId) => {
        onAddToPlaylist(song.id, playlistId);
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

    // Get user's playlists for the submenu
    const userPlaylists = store.idNamePairs || [];

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
                    sx={{ position: 'relative' }}
                >
                    Add to Playlist
                    {/* Submenu for playlists */}
                    {playlistMenuAnchor && userPlaylists.length > 0 && (
                        <div className="playlist-submenu">
                            {userPlaylists.map((playlist) => (
                                <div
                                    key={playlist._id || playlist.id}
                                    className="playlist-submenu-item"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handlePlaylistSelect(playlist._id || playlist.id);
                                    }}
                                >
                                    {playlist.name}
                                </div>
                            ))}
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

