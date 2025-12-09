import { useState, useEffect, useCallback, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import ClearIcon from '@mui/icons-material/Clear';
import EditIcon from '@mui/icons-material/Edit';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CloseIcon from '@mui/icons-material/Close';
import UndoIcon from '@mui/icons-material/Undo';
import RedoIcon from '@mui/icons-material/Redo';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import AddIcon from '@mui/icons-material/Add';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';

export default function EditPlaylistModal({ playlist, onClose, onSave }) {
    const history = useHistory();
    
    const [playlistName, setPlaylistName] = useState('');
    const [songs, setSongs] = useState([]);
    const [editingNameMode, setEditingNameMode] = useState(false);
    
    const [undoStack, setUndoStack] = useState([]);
    const [redoStack, setRedoStack] = useState([]);
    
    const [editingSongIndex, setEditingSongIndex] = useState(null);
    const [editSongData, setEditSongData] = useState({ title: '', artist: '', year: '', youTubeId: '' });

    // For drag and drop state
    const [draggedIndex, setDraggedIndex] = useState(null);
    const [dragOverIndex, setDragOverIndex] = useState(null);
    const dragSongsRef = useRef(songs); // Keep track of songs during drag

    useEffect(() => {
        if (playlist) {
            setPlaylistName(playlist.name || '');
            setSongs(playlist.songs ? [...playlist.songs] : []);
            // Reset transaction stacks when playlist changes
            setUndoStack([]);
            setRedoStack([]);
        }
    }, [playlist]);

    // Keep drag ref in sync with songs
    useEffect(() => {
        dragSongsRef.current = songs;
    }, [songs]);

    // Save current state to undo stack before making changes
    const saveToUndoStack = useCallback(() => {
        setUndoStack(prev => [...prev, { name: playlistName, songs: [...songs] }]);
        setRedoStack([]); // Clear redo stack on new action
    }, [playlistName, songs]);

    const handleUndo = () => {
        if (undoStack.length === 0) return;
        
        const previousState = undoStack[undoStack.length - 1];
        setRedoStack(prev => [...prev, { name: playlistName, songs: [...songs] }]);
        setUndoStack(prev => prev.slice(0, -1));
        setPlaylistName(previousState.name);
        setSongs([...previousState.songs]);
    };

    const handleRedo = () => {
        if (redoStack.length === 0) return;
        
        const nextState = redoStack[redoStack.length - 1];
        setUndoStack(prev => [...prev, { name: playlistName, songs: [...songs] }]);
        setRedoStack(prev => prev.slice(0, -1));
        setPlaylistName(nextState.name);
        setSongs([...nextState.songs]);
    };

    const handleNameChange = (newName) => {
        if (newName !== playlistName) {
            saveToUndoStack();
            setPlaylistName(newName);
        }
        setEditingNameMode(false);
    };

    const handleRemoveSong = (index) => {
        saveToUndoStack();
        setSongs(prev => prev.filter((_, i) => i !== index));
    };

    const handleDuplicateSong = (index) => {
        saveToUndoStack();
        const songToDuplicate = { ...songs[index] };
        const newSongs = [...songs];
        newSongs.splice(index + 1, 0, songToDuplicate);
        setSongs(newSongs);
    };

    const handleEditSong = (index) => {
        setEditingSongIndex(index);
        setEditSongData({
            title: songs[index].title || '',
            artist: songs[index].artist || '',
            year: songs[index].year?.toString() || '',
            youTubeId: songs[index].youTubeId || ''
        });
    };

    const handleSaveEditedSong = () => {
        if (editingSongIndex === null) return;
        
        saveToUndoStack();
        const newSongs = [...songs];
        newSongs[editingSongIndex] = {
            title: editSongData.title,
            artist: editSongData.artist,
            year: parseInt(editSongData.year) || 0,
            youTubeId: editSongData.youTubeId
        };
        setSongs(newSongs);
        setEditingSongIndex(null);
    };

    const handleDragStart = (e, index) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', index.toString());
        setTimeout(() => {
            e.target.classList.add('dragging');
        }, 0);
    };

    const handleDragEnd = (e) => {
        e.target.classList.remove('dragging');
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    const handleDragOver = (e, index) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        
        if (index !== dragOverIndex) {
            setDragOverIndex(index);
        }
    };

    const handleDragLeave = (e) => {
        // Only clear if actually leaving the element (not entering a child)
        if (!e.currentTarget.contains(e.relatedTarget)) {
            setDragOverIndex(null);
        }
    };

    const handleDrop = (e, dropIndex) => {
        e.preventDefault();
        
        const fromIndex = draggedIndex;
        const toIndex = dropIndex;
        
        if (fromIndex === null || fromIndex === toIndex) {
            setDraggedIndex(null);
            setDragOverIndex(null);
            return;
        }
        
        // Save to undo stack before reordering
        saveToUndoStack();
        
        // Reorder songs
        const newSongs = [...songs];
        const [draggedSong] = newSongs.splice(fromIndex, 1);
        newSongs.splice(toIndex, 0, draggedSong);
        
        setSongs(newSongs);
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    // Navigate to Songs Catalog to add songs
    const handleAddSong = () => {
        // Save current state before navigating
        handleSaveToDatabase();
        history.push('/songs');
    };

    const handleSaveToDatabase = async () => {
        try {
            const response = await fetch(`http://localhost:4000/store/playlist/${playlist.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    name: playlistName,
                    songs: songs
                })
            });
            
            if (response.ok && onSave) {
                onSave();
            }
        } catch (error) {
            console.error('Error saving playlist:', error);
        }
    };

    // Close modal and save changes
    const handleClose = () => {
        handleSaveToDatabase();
        onClose();
    };

    if (!playlist) return null;

    return (
        <div className="modal-overlay">
            <div className="edit-playlist-modal">
                <div className="edit-modal-header">
                    Edit Playlist
                </div>
                
                <div className="edit-modal-content">
                    {/* Playlist Name */}
                    <div className="edit-modal-name-row">
                        {editingNameMode ? (
                            <input
                                type="text"
                                value={playlistName}
                                onChange={(e) => setPlaylistName(e.target.value)}
                                onBlur={() => handleNameChange(playlistName)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleNameChange(playlistName);
                                    if (e.key === 'Escape') {
                                        setPlaylistName(playlist.name);
                                        setEditingNameMode(false);
                                    }
                                }}
                                autoFocus
                                className="edit-playlist-name-input"
                            />
                        ) : (
                            <h2 
                                className="edit-playlist-name"
                                onClick={() => setEditingNameMode(true)}
                            >
                                {playlistName}
                            </h2>
                        )}
                        <IconButton onClick={() => setEditingNameMode(true)} size="small">
                            <ClearIcon sx={{ fontSize: 18 }} />
                        </IconButton>
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={handleAddSong}
                            sx={{
                                backgroundColor: '#5c4d7d',
                                fontSize: '12px',
                                ml: 'auto',
                                '&:hover': { backgroundColor: '#7b68a6' }
                            }}
                        >
                            <MusicNoteIcon />
                        </Button>
                    </div>
                    
                    {/* Song List - Draggable */}
                    <div className="edit-modal-songs">
                        {songs.length === 0 ? (
                            <div className="no-songs-message">
                                No songs in this playlist. Click +♪ to add songs.
                            </div>
                        ) : (
                            songs.map((song, index) => (
                                <div 
                                    key={index} 
                                    className={`edit-song-item ${draggedIndex === index ? 'dragging' : ''} ${dragOverIndex === index ? 'drag-over' : ''}`}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, index)}
                                    onDragEnd={handleDragEnd}
                                    onDragOver={(e) => handleDragOver(e, index)}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, index)}
                                >
                                    {/* Drag Handle */}
                                    <div className="drag-handle" title="Drag to reorder">
                                        <DragIndicatorIcon sx={{ fontSize: 20, color: '#888', cursor: 'grab' }} />
                                    </div>
                                    
                                    <span className="edit-song-text">
                                        {index + 1}. {song.title} by {song.artist} ({song.year})
                                    </span>
                                    <div className="edit-song-actions">
                                        <IconButton 
                                            size="small" 
                                            onClick={() => handleEditSong(index)}
                                            title="Edit song"
                                        >
                                            <EditIcon sx={{ fontSize: 18 }} />
                                        </IconButton>
                                        <IconButton 
                                            size="small" 
                                            onClick={() => handleDuplicateSong(index)}
                                            title="Duplicate song"
                                        >
                                            <ContentCopyIcon sx={{ fontSize: 18 }} />
                                        </IconButton>
                                        <IconButton 
                                            size="small" 
                                            onClick={() => handleRemoveSong(index)}
                                            title="Remove song"
                                        >
                                            <CloseIcon sx={{ fontSize: 18 }} />
                                        </IconButton>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    
                    {/* Bottom Actions */}
                    <div className="edit-modal-actions">
                        <div className="edit-modal-undo-redo">
                            <Button
                                variant="contained"
                                startIcon={<UndoIcon />}
                                onClick={handleUndo}
                                disabled={undoStack.length === 0}
                                sx={{
                                    backgroundColor: '#5c4d7d',
                                    '&:hover': { backgroundColor: '#7b68a6' },
                                    '&:disabled': { backgroundColor: '#ccc' }
                                }}
                            >
                                Undo
                            </Button>
                            <Button
                                variant="contained"
                                startIcon={<RedoIcon />}
                                onClick={handleRedo}
                                disabled={redoStack.length === 0}
                                sx={{
                                    backgroundColor: '#5c4d7d',
                                    '&:hover': { backgroundColor: '#7b68a6' },
                                    '&:disabled': { backgroundColor: '#ccc' }
                                }}
                            >
                                Redo
                            </Button>
                        </div>
                        <Button
                            variant="contained"
                            onClick={handleClose}
                            sx={{
                                backgroundColor: '#4caf50',
                                '&:hover': { backgroundColor: '#66bb6a' }
                            }}
                        >
                            Close
                        </Button>
                    </div>
                </div>
                
                {/* Edit Song Sub-Modal */}
                {editingSongIndex !== null && (
                    <div className="edit-song-modal-overlay">
                        <div className="edit-song-modal">
                            <div className="edit-song-modal-header">Edit Song</div>
                            <div className="edit-song-modal-content">
                                <div className="modal-input-group">
                                    <input
                                        type="text"
                                        placeholder="Title"
                                        value={editSongData.title}
                                        onChange={(e) => setEditSongData({...editSongData, title: e.target.value})}
                                    />
                                    <button className="clear-btn" onClick={() => setEditSongData({...editSongData, title: ''})}>
                                        <ClearIcon sx={{ fontSize: 16 }} />
                                    </button>
                                </div>
                                <div className="modal-input-group">
                                    <input
                                        type="text"
                                        placeholder="Artist"
                                        value={editSongData.artist}
                                        onChange={(e) => setEditSongData({...editSongData, artist: e.target.value})}
                                    />
                                    <button className="clear-btn" onClick={() => setEditSongData({...editSongData, artist: ''})}>
                                        <ClearIcon sx={{ fontSize: 16 }} />
                                    </button>
                                </div>
                                <div className="modal-input-group">
                                    <input
                                        type="text"
                                        placeholder="Year"
                                        value={editSongData.year}
                                        onChange={(e) => setEditSongData({...editSongData, year: e.target.value})}
                                    />
                                    <button className="clear-btn" onClick={() => setEditSongData({...editSongData, year: ''})}>
                                        <ClearIcon sx={{ fontSize: 16 }} />
                                    </button>
                                </div>
                                <div className="modal-input-group">
                                    <input
                                        type="text"
                                        placeholder="YouTube ID"
                                        value={editSongData.youTubeId}
                                        onChange={(e) => setEditSongData({...editSongData, youTubeId: e.target.value})}
                                    />
                                    <button className="clear-btn" onClick={() => setEditSongData({...editSongData, youTubeId: ''})}>
                                        <ClearIcon sx={{ fontSize: 16 }} />
                                    </button>
                                </div>
                                <div className="modal-buttons">
                                    <button
                                        className="modal-btn complete-btn"
                                        onClick={handleSaveEditedSong}
                                    >
                                        Complete
                                    </button>
                                    <button
                                        className="modal-btn cancel-btn"
                                        onClick={() => setEditingSongIndex(null)}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
