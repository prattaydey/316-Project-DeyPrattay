import { useState, useEffect, useRef } from 'react';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';

export default function PlayPlaylistModal({ playlist, onClose }) {
    const [currentSongIndex, setCurrentSongIndex] = useState(0);
    const [hasRecordedPlay, setHasRecordedPlay] = useState(false);
    const [isPlaying, setIsPlaying] = useState(true);
    const playerRef = useRef(null);

    // Record play when modal opens
    useEffect(() => {
        if (playlist && !hasRecordedPlay && playlist.id) {
            fetch(`http://localhost:4000/store/playlist/${playlist.id}/play`, {
                method: 'POST',
                credentials: 'include'
            }).catch(error => {
                console.error('Error recording play:', error);
            });
            setHasRecordedPlay(true);
        }
    }, [playlist, hasRecordedPlay]);

    // Reset to playing when song changes (autoplay kicks in)
    useEffect(() => {
        setIsPlaying(true);
    }, [currentSongIndex]);

    if (!playlist) {
        return null;
    }

    const songs = playlist.songs || [];
    const currentSong = songs[currentSongIndex];

    const handlePlayPause = () => {
        if (playerRef.current) {
            const iframe = playerRef.current;
            if (isPlaying) {
                iframe.contentWindow.postMessage(
                    JSON.stringify({ event: 'command', func: 'pauseVideo' }), 
                    '*'
                );
            } else {
                iframe.contentWindow.postMessage(
                    JSON.stringify({ event: 'command', func: 'playVideo' }), 
                    '*'
                );
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handlePrevious = () => {
        if (currentSongIndex > 0) {
            setCurrentSongIndex(currentSongIndex - 1);
        }
    };

    const handleNext = () => {
        if (currentSongIndex < songs.length - 1) {
            setCurrentSongIndex(currentSongIndex + 1);
        }
    };

    const handleSongClick = (index) => {
        setCurrentSongIndex(index);
    };

    // Get avatar display
    const getAvatarDisplay = () => {
        const letter = playlist.ownerName?.charAt(0).toUpperCase() || 'P';
        const colors = ['#7b68a6', '#5c4d7d', '#9c27b0', '#673ab7', '#3f51b5'];
        const colorIndex = playlist.ownerName?.charCodeAt(0) % colors.length || 0;
        
        return (
            <div 
                className="modal-playlist-avatar" 
                style={{ backgroundColor: colors[colorIndex] }}
            >
                {letter}
            </div>
        );
    };

    return (
        <div className="modal-overlay">
            <div className="play-playlist-modal">
                <div className="play-modal-header">
                    Play Playlist
                </div>
                
                <div className="play-modal-content">
                    {/* Left Side - Playlist Info and Songs */}
                    <div className="play-modal-left">
                        <div className="play-modal-playlist-info">
                            {getAvatarDisplay()}
                            <div className="play-modal-playlist-details">
                                <div className="play-modal-playlist-name">{playlist.name}</div>
                                <div className="play-modal-playlist-owner">{playlist.ownerName}</div>
                            </div>
                        </div>
                        
                        <div className="play-modal-song-list">
                            {songs.length === 0 ? (
                                <div className="no-songs">No songs in this playlist</div>
                            ) : (
                                songs.map((song, index) => (
                                    <div 
                                        key={index}
                                        className={`play-modal-song-item ${index === currentSongIndex ? 'playing' : ''}`}
                                        onClick={() => handleSongClick(index)}
                                    >
                                        {index + 1}. {song.title} by {song.artist} ({song.year})
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                    
                    {/* Right Side - YouTube Player and Controls */}
                    <div className="play-modal-right">
                        <div className="play-modal-player">
                            {currentSong ? (
                                <iframe
                                    ref={playerRef}
                                    width="100%"
                                    height="200"
                                    src={`https://www.youtube.com/embed/${currentSong.youTubeId}?autoplay=1&enablejsapi=1`}
                                    title="YouTube video player"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                />
                            ) : (
                                <div className="no-song-playing">
                                    No song to play
                                </div>
                            )}
                        </div>
                        
                        <div className="play-modal-controls">
                            <IconButton 
                                onClick={handlePrevious}
                                disabled={currentSongIndex === 0}
                                sx={{ color: currentSongIndex === 0 ? '#ccc' : '#333' }}
                            >
                                <SkipPreviousIcon />
                            </IconButton>
                            <IconButton 
                                onClick={handlePlayPause}
                                sx={{ 
                                    color: '#333',
                                    backgroundColor: '#e0e0e0',
                                    '&:hover': { backgroundColor: '#bdbdbd' }
                                }}
                            >
                                {isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                            </IconButton>
                            <IconButton 
                                onClick={handleNext}
                                disabled={currentSongIndex >= songs.length - 1}
                                sx={{ color: currentSongIndex >= songs.length - 1 ? '#ccc' : '#333' }}
                            >
                                <SkipNextIcon />
                            </IconButton>
                        </div>
                        
                        <Button
                            variant="contained"
                            onClick={onClose}
                            sx={{
                                backgroundColor: '#5c4d7d',
                                borderRadius: '20px',
                                textTransform: 'none',
                                mt: 2,
                                '&:hover': { backgroundColor: '#7b68a6' }
                            }}
                        >
                            Close
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
