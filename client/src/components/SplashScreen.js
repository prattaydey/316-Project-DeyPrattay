import { useHistory } from 'react-router-dom'

/*
    Welcome Screen - Landing page for guests
    Shows navigation options: Create Account, Login, Continue as Guest
    
    @author McKilla Gorilla
*/
export default function SplashScreen() {
    const history = useHistory();

    const handleCreateAccount = () => {
        history.push('/register/');
    }

    const handleLogin = () => {
        history.push('/login/');
    }

    const handleContinueAsGuest = () => {
        // Navigate to playlists view with 'all' view to show published playlists
        history.push('/playlists');
    }

    return (
        <div id="splash-screen">
            <div id="splash-content">
                <div id="splash-title">The Playlister</div>
                <div id="splash-logo">
                    <img src="/images/playlister-logo.png" alt="Playlister Logo" className="splash-logo-img" />
                </div>
                <div id="splash-buttons">
                    <button 
                        className="splash-button"
                        onClick={handleContinueAsGuest}
                    >
                        Continue as Guest
                    </button>
                    <button 
                        className="splash-button"
                        onClick={handleLogin}
                    >
                        Login
                    </button>
                    <button 
                        className="splash-button"
                        onClick={handleCreateAccount}
                    >
                        Create Account
                    </button>
                </div>
            </div>
        </div>
    )
}