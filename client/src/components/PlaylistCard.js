import { useState } from 'react';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import Button from '@mui/material/Button';

export default function PlaylistCard({ 
    playlist, 
    isOwner, 
    onPlay, 
    onCopy, 
    onDelete,
    onRefresh 
}) {
    const [expanded, setExpanded] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(playlist?.name || '');

    // Guard against undefined playlist
    if (!playlist) {
        return null;
    }

    const handleToggleExpand = () => {
        setExpanded(!expanded);
    };

    const handleEdit = () => {
        setIsEditing(true);
        setEditName(playlist?.name || '');
    };

    const handleSaveName = async () => {
        if (editName.trim() === '') return;
        
        try {
            const response = await fetch(`http://localhost:4000/store/playlist/${playlist.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({ name: editName.trim() })
            });
            
            if (response.ok) {
                setIsEditing(false);
                onRefresh();
            }
        } catch (error) {
            console.error('Error updating playlist:', error);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter') {
            handleSaveName();
        } else if (e.key === 'Escape') {
            setIsEditing(false);
            setEditName(playlist?.name || '');
        }
    };

    const handlePublish = async () => {
        try {
            const response = await fetch(`http://localhost:4000/store/playlist/${playlist.id}/publish`, {
                method: 'PUT',
                credentials: 'include'
            });
            
            if (response.ok) {
                onRefresh();
            }
        } catch (error) {
            console.error('Error publishing playlist:', error);
        }
    };

    // Get avatar - use owner's avatar or a default
    const getAvatarDisplay = () => {
        // For now, use a colored circle with first letter
        const letter = playlist.ownerName?.charAt(0).toUpperCase() || 'P';
        const colors = ['#7b68a6', '#5c4d7d', '#9c27b0', '#673ab7', '#3f51b5'];
        const colorIndex = playlist.ownerName?.charCodeAt(0) % colors.length || 0;
        
        return (
            <div 
                className="playlist-avatar" 
                style={{ backgroundColor: colors[colorIndex] }}
            >
                {letter}
            </div>
        );
    };

    return (
        <div className={`playlist-card ${isOwner ? 'owned' : ''}`}>
            <div className="playlist-card-main">
                {getAvatarDisplay()}
                
                <div className="playlist-card-info">
                    {isEditing ? (
                        <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={handleKeyPress}
                            onBlur={handleSaveName}
                            autoFocus
                            className="playlist-name-input"
                        />
                    ) : (
                        <div className="playlist-name">{playlist.name}</div>
                    )}
                    <div className="playlist-owner">{playlist.ownerName}</div>
                </div>
                
                <div className="playlist-card-actions">
                    {isOwner && (
                        <Button
                            variant="outlined"
                            size="small"
                            onClick={handleEdit}
                            sx={{
                                borderColor: '#5c4d7d',
                                color: '#5c4d7d',
                                fontSize: '11px',
                                py: 0.3,
                                px: 1,
                                minWidth: 'auto',
                                '&:hover': { borderColor: '#7b68a6', backgroundColor: '#f3e5f5' }
                            }}
                        >
                            Edit
                        </Button>
                    )}
                    <Button
                        variant="outlined"
                        size="small"
                        onClick={onCopy}
                        sx={{
                            borderColor: '#5c4d7d',
                            color: '#5c4d7d',
                            fontSize: '11px',
                            py: 0.3,
                            px: 1,
                            minWidth: 'auto',
                            '&:hover': { borderColor: '#7b68a6', backgroundColor: '#f3e5f5' }
                        }}
                    >
                        Copy
                    </Button>
                    <Button
                        variant="contained"
                        size="small"
                        onClick={onPlay}
                        sx={{
                            backgroundColor: '#5c4d7d',
                            fontSize: '11px',
                            py: 0.3,
                            px: 1,
                            minWidth: 'auto',
                            '&:hover': { backgroundColor: '#7b68a6' }
                        }}
                    >
                        Play
                    </Button>
                    
                    <button className="expand-btn" onClick={handleToggleExpand}>
                        {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </button>
                </div>
            </div>
            
            {/* Expanded Song List */}
            {expanded && (
                <div className="playlist-card-songs">
                    {playlist.songs && playlist.songs.length > 0 ? (
                        playlist.songs.map((song, index) => (
                            <div key={index} className="playlist-song-item">
                                {index + 1}. {song.title} by {song.artist} ({song.year})
                            </div>
                        ))
                    ) : (
                        <div className="no-songs">No songs in this playlist</div>
                    )}
                    
                    {/* Owner Actions */}
                    {isOwner && (
                        <div className="playlist-owner-actions">
                            {!playlist.published && (
                                <Button
                                    variant="contained"
                                    size="small"
                                    onClick={handlePublish}
                                    sx={{
                                        backgroundColor: '#4caf50',
                                        fontSize: '11px',
                                        '&:hover': { backgroundColor: '#66bb6a' }
                                    }}
                                >
                                    Publish
                                </Button>
                            )}
                            <Button
                                variant="contained"
                                size="small"
                                onClick={onDelete}
                                sx={{
                                    backgroundColor: '#f44336',
                                    fontSize: '11px',
                                    '&:hover': { backgroundColor: '#ef5350' }
                                }}
                            >
                                Delete
                            </Button>
                        </div>
                    )}
                </div>
            )}
            
            {/* Listeners Count */}
            <div className="playlist-listeners">
                {playlist.listens || 0} Listeners
            </div>
        </div>
    );
}
