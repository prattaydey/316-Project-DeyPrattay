import { useState, useEffect } from 'react';
import ClearIcon from '@mui/icons-material/Clear';

export default function MUIEditCatalogSongModal({ song, onClose, onSongUpdated }) {
    const [title, setTitle] = useState(song.title || '');
    const [artist, setArtist] = useState(song.artist || '');
    const [year, setYear] = useState(song.year?.toString() || '');
    const [youTubeId, setYouTubeId] = useState(song.youTubeId || '');
    const [isFormValid, setIsFormValid] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const valid = 
            title.trim().length > 0 &&
            artist.trim().length > 0 &&
            year.trim().length > 0 &&
            !isNaN(parseInt(year)) &&
            youTubeId.trim().length > 0;
        setIsFormValid(valid);
    }, [title, artist, year, youTubeId]);

    const handleSubmit = async () => {
        if (!isFormValid) return;
        
        try {
            const response = await fetch(`http://localhost:4000/songs/${song.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify({
                    title: title.trim(),
                    artist: artist.trim(),
                    year: parseInt(year),
                    youTubeId: youTubeId.trim()
                })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                onSongUpdated();
            } else {
                setError(data.errorMessage || 'Failed to update song');
            }
        } catch (err) {
            setError('Failed to update song. Please try again.');
        }
    };

    const clearField = (setter) => {
        setter('');
    };

    return (
        <div className="modal-overlay">
            <div className="song-modal">
                <div className="song-modal-header">
                    Edit Song
                </div>
                <div className="song-modal-content">
                    {error && <div className="modal-error">{error}</div>}
                    
                    <div className="modal-input-group">
                        <input
                            type="text"
                            placeholder="Title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                        <button className="clear-btn" onClick={() => clearField(setTitle)}>
                            <ClearIcon sx={{ fontSize: 16 }} />
                        </button>
                    </div>
                    
                    <div className="modal-input-group">
                        <input
                            type="text"
                            placeholder="Artist"
                            value={artist}
                            onChange={(e) => setArtist(e.target.value)}
                        />
                        <button className="clear-btn" onClick={() => clearField(setArtist)}>
                            <ClearIcon sx={{ fontSize: 16 }} />
                        </button>
                    </div>
                    
                    <div className="modal-input-group">
                        <input
                            type="text"
                            placeholder="Year"
                            value={year}
                            onChange={(e) => setYear(e.target.value)}
                        />
                        <button className="clear-btn" onClick={() => clearField(setYear)}>
                            <ClearIcon sx={{ fontSize: 16 }} />
                        </button>
                    </div>
                    
                    <div className="modal-input-group youtube-id-input">
                        <input
                            type="text"
                            placeholder="YouTube Id"
                            value={youTubeId}
                            onChange={(e) => setYouTubeId(e.target.value)}
                        />
                        <button className="clear-btn" onClick={() => clearField(setYouTubeId)}>
                            <ClearIcon sx={{ fontSize: 16 }} />
                        </button>
                    </div>
                    
                    <div className="modal-buttons">
                        <button
                            className={`modal-btn complete-btn ${!isFormValid ? 'disabled' : ''}`}
                            onClick={handleSubmit}
                            disabled={!isFormValid}
                        >
                            Complete
                        </button>
                        <button
                            className="modal-btn cancel-btn"
                            onClick={onClose}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

