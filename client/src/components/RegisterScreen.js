import { useContext, useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../auth'
import MUIErrorModal from './MUIErrorModal'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import ClearIcon from '@mui/icons-material/Clear';

// Avatar image requirements
const AVATAR_REQUIRED_SIZE = 250;  // Must be exactly 250x250 pixels
const AVATAR_MAX_FILE_SIZE = 1024 * 1024; // 1MB max file size

export default function RegisterScreen() {
    const { auth } = useContext(AuthContext);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [avatarBase64, setAvatarBase64] = useState(null);
    const [avatarError, setAvatarError] = useState(null);
    const fileInputRef = useRef(null);
    
    // Form field states
    const [userName, setUserName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordVerify, setPasswordVerify] = useState('');
    
    // Validation state
    const [isFormValid, setIsFormValid] = useState(false);

    // Check if form is valid whenever fields change
    useEffect(() => {
        const isValid = 
            userName.trim().length > 0 &&
            email.trim().length > 0 &&
            email.includes('@') &&
            password.length >= 8 &&
            passwordVerify.length > 0 &&
            password === passwordVerify;
        setIsFormValid(isValid);
    }, [userName, email, password, passwordVerify]);

    const handleAvatarSelect = (event) => {
        const file = event.target.files[0];
        setAvatarError(null);
        
        if (file) {
            if (!file.type.startsWith('image/')) {
                setAvatarError('Please select an image file (PNG, JPG, GIF)');
                return;
            }
            
            if (file.size > AVATAR_MAX_FILE_SIZE) {
                setAvatarError(`Image file must be less than 1MB (yours: ${(file.size / 1024 / 1024).toFixed(2)}MB)`);
                return;
            }
            
            // Create image to check dimensions
            const img = new Image();
            const reader = new FileReader();
            
            reader.onloadend = () => {
                img.onload = () => {
                    // Validate image dimensions - must be exactly 250x250
                    if (img.width !== AVATAR_REQUIRED_SIZE || img.height !== AVATAR_REQUIRED_SIZE) {
                        setAvatarError(`Image must be exactly ${AVATAR_REQUIRED_SIZE}x${AVATAR_REQUIRED_SIZE}px (yours: ${img.width}x${img.height}px)`);
                        setAvatarPreview(null);
                        setAvatarBase64(null);
                        return;
                    }
                    
                    // Image is valid
                    setAvatarError(null);
                    setAvatarPreview(reader.result);
                    setAvatarBase64(reader.result);
                };
                img.src = reader.result;
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        if (!isFormValid) return;
        
        auth.registerUser(
            userName,
            email,
            password,
            passwordVerify,
            avatarBase64
        );
    };

    const clearField = (fieldId, setter) => {
        setter('');
    };

    let modalJSX = ""
    if (auth.errorMessage !== null){
        modalJSX = <MUIErrorModal />;
    }

    return (
        <div id="register-screen">
            <div id="register-content">
                {/* Lock Icon */}
                <div className="register-icon">
                    <LockOutlinedIcon sx={{ fontSize: 48, color: '#333' }} />
                </div>
                
                {/* Title */}
                <h1 className="register-title">Create Account</h1>
                
                {/* Form with Avatar */}
                <form onSubmit={handleSubmit} className="register-form">
                    <div className="register-form-container">
                        {/* Avatar Selector */}
                        <div className="avatar-selector">
                            <div className={`avatar-preview ${avatarError ? 'avatar-error-border' : ''}`}>
                                {avatarPreview ? (
                                    <img src={avatarPreview} alt="Avatar preview" />
                                ) : (
                                    <img src="/images/default-avatar.png" alt="Default avatar" className="avatar-placeholder-img" />
                                )}
                            </div>
                            <input
                                type="file"
                                accept="image/png,image/jpeg,image/gif,image/webp"
                                onChange={handleAvatarSelect}
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                            />
                            <button 
                                type="button" 
                                className="avatar-select-btn"
                                onClick={() => fileInputRef.current.click()}
                            >
                                Select
                            </button>
                            <div className="avatar-requirements">
                                {AVATAR_REQUIRED_SIZE}x{AVATAR_REQUIRED_SIZE}px
                            </div>
                            {avatarError && (
                                <div className="avatar-error-message">
                                    {avatarError}
                                </div>
                            )}
                        </div>
                        
                        {/* Form Fields */}
                        <div className="register-fields">
                            <div className="input-group">
                                <input
                                    type="text"
                                    id="userName"
                                    name="userName"
                                    placeholder="User Name"
                                    value={userName}
                                    onChange={(e) => setUserName(e.target.value)}
                                    required
                                    autoFocus
                                />
                                <button type="button" className="clear-btn" onClick={() => clearField('userName', setUserName)}>
                                    <ClearIcon sx={{ fontSize: 18 }} />
                                </button>
                            </div>
                            
                            <div className="input-group">
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    placeholder="Email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                                <button type="button" className="clear-btn" onClick={() => clearField('email', setEmail)}>
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
                                <button type="button" className="clear-btn" onClick={() => clearField('password', setPassword)}>
                                    <ClearIcon sx={{ fontSize: 18 }} />
                                </button>
                            </div>
                            
                            <div className="input-group">
                                <input
                                    type="password"
                                    id="passwordVerify"
                                    name="passwordVerify"
                                    placeholder="Password Confirm"
                                    value={passwordVerify}
                                    onChange={(e) => setPasswordVerify(e.target.value)}
                                    required
                                />
                                <button type="button" className="clear-btn" onClick={() => clearField('passwordVerify', setPasswordVerify)}>
                                    <ClearIcon sx={{ fontSize: 18 }} />
                                </button>
                            </div>
                            
                            {/* Validation hints */}
                            {password.length > 0 && password.length < 8 && (
                                <div className="validation-hint">Password must be at least 8 characters</div>
                            )}
                            {passwordVerify.length > 0 && password !== passwordVerify && (
                                <div className="validation-hint">Passwords do not match</div>
                            )}
                            
                            <button 
                                type="submit" 
                                className={`register-submit-btn ${!isFormValid ? 'register-submit-btn-disabled' : ''}`}
                                disabled={!isFormValid}
                            >
                                Create Account
                            </button>
                            
                            <Link to="/login/" className="register-signin-link">
                                Already have an account? Sign In
                            </Link>
                        </div>
                    </div>
                </form>
                
                {/* Copyright */}
                <div className="register-copyright">
                    Copyright © Playlister 2025
                </div>
                
                { modalJSX }
            </div>
        </div>
    );
}