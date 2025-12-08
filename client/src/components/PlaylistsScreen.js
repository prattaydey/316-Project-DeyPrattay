import { useContext, useEffect, useState } from 'react'
import { GlobalStoreContext } from '../store'
import AuthContext from '../auth'
import MUIDeleteModal from './MUIDeleteModal'

/*
    Playlists Screen - Shows playlists based on view mode
    Supports: Home (my playlists), All (published), User (by username)
    Accessible by both logged-in users and guests
    
    @author McKilla Gorilla
*/
const PlaylistsScreen = () => {
    const { store } = useContext(GlobalStoreContext);
    const { auth } = useContext(AuthContext);
    const [view] = useState('all'); // Default to 'all' for guests

    useEffect(() => {
        // For now, just show message. Will be fully implemented in Phase 3.4
        console.log("PlaylistsScreen loaded - view:", view);
    }, [view]);

    return (
        <div id="playlists-screen">
            <div id="playlists-content">
                <div className="playlists-placeholder">
                    <span>🎵</span>
                    <h2>Playlists Screen</h2>
                    <p>
                        {auth.loggedIn 
                            ? "Welcome! Viewing your playlists..." 
                            : "Welcome Guest! Browsing published playlists..."}
                    </p>
                </div>
                <MUIDeleteModal />
            </div>
        </div>
    )
}

export default PlaylistsScreen;

