import { useContext } from 'react'
import PlaylistsScreen from './PlaylistsScreen'
import SplashScreen from './SplashScreen'
import AuthContext from '../auth'

export default function HomeWrapper() {
    const { auth } = useContext(AuthContext);
    console.log("HomeWrapper auth.loggedIn: " + auth.loggedIn);
    
    // If logged in, show playlists screen (defaults to user's own playlists)
    // If not logged in, show splash screen
    if (auth.loggedIn)
        return <PlaylistsScreen />
    else
        return <SplashScreen />
}