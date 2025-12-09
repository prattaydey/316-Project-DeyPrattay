import { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../auth'
import MUIErrorModal from './MUIErrorModal'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import ClearIcon from '@mui/icons-material/Clear';

export default function LoginScreen() {
    const { auth } = useContext(AuthContext);
    
    // Form field states
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (event) => {
        event.preventDefault();
        auth.loginUser(email, password);
    };

    const clearField = (setter) => {
        setter('');
    };

    let modalJSX = "";
    if (auth.errorMessage !== null){
        modalJSX = <MUIErrorModal />;
    }

    return (
        <div id="login-screen">
            <div id="login-content">
                {/* Lock Icon */}
                <div className="login-icon">
                    <LockOutlinedIcon sx={{ fontSize: 48, color: '#333' }} />
                </div>
                
                {/* Title */}
                <h1 className="login-title">Sign In</h1>
                
                {/* Form */}
                <form onSubmit={handleSubmit} className="login-form">
                    <div className="login-fields">
                        <div className="input-group">
                            <input
                                type="email"
                                id="email"
                                name="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                autoFocus
                            />
                            <button type="button" className="clear-btn" onClick={() => clearField(setEmail)}>
                                <ClearIcon sx={{ fontSize: 18 }} />
                            </button>
                        </div>
                        
                        <div className="input-group">
                            <input
                                type="password"
                                id="password"
                                name="password"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button type="button" className="clear-btn" onClick={() => clearField(setPassword)}>
                                <ClearIcon sx={{ fontSize: 18 }} />
                            </button>
                        </div>
                        
                        <button type="submit" className="login-submit-btn">
                            SIGN IN
                        </button>
                        
                        <Link to="/register/" className="login-signup-link">
                            Don't have an account? Sign Up
                        </Link>
                    </div>
                </form>
                
                {/* Copyright */}
                <div className="login-copyright">
                    Copyright © Playlister 2025
                </div>
                
                { modalJSX }
            </div>
        </div>
    );
}
