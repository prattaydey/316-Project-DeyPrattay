import { useContext, useState, useRef, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import AuthContext from '../auth'
import MUIErrorModal from './MUIErrorModal'
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import ClearIcon from '@mui/icons-material/Clear';

// Avatar image requirements
const AVATAR_REQUIRED_SIZE = 250;  // Must be exactly 250x250 pixels
const AVATAR_MAX_FILE_SIZE = 1024 * 1024; // 1MB max file size

export default function EditAccountScreen() {
    const { auth } = useContext(AuthContext);
    const history = useHistory();
    const fileInputRef = useRef(null);
    
    const [userName, setUserName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordVerify, setPasswordVerify] = useState('');
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [avatarBase64, setAvatarBase64] = useState(null);
    const [avatarError, setAvatarError] = useState(null);
    const [isFormValid, setIsFormValid] = useState(false);

    // Pre-populate form with current user data
    useEffect(() => {
        if (auth.user) {
            setUserName(auth.user.userName || '');
            setEmail(auth.user.email || '');
            if (auth.user.avatarImage) {
                setAvatarPreview(auth.user.avatarImage);
                setAvatarBase64(auth.user.avatarImage);
            }
        }
    }, [auth.user]);

    useEffect(() => {
        // For edit, password is optional (only required if user wants to change it)
        const passwordValid = password.length === 0 || (password.length >= 8 && password === passwordVerify);
        const isValid = 
            userName.trim().length > 0 &&
            email.trim().length > 0 &&
            email.includes('@') &&
            passwordValid;
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
            
            const img = new Image();
            const reader = new FileReader();
            
            reader.onloadend = () => {
                img.onload = () => {
                    if (img.width !== AVATAR_REQUIRED_SIZE || img.height !== AVATAR_REQUIRED_SIZE) {
                        setAvatarError(`Image must be exactly ${AVATAR_REQUIRED_SIZE}x${AVATAR_REQUIRED_SIZE}px (yours: ${img.width}x${img.height}px)`);
                        setAvatarPreview(null);
                        setAvatarBase64(null);
                        return;
                    }
                    
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
        
        auth.updateUser(
            userName,
            email,
            password.length > 0 ? password : null,  // Only send password if changed
            password.length > 0 ? passwordVerify : null,
            avatarBase64
        );
    };

    const handleCancel = () => {
        history.push('/');
    };

    const clearField = (fieldId, setter) => {
        setter('');
    };

    let modalJSX = ""
    if (auth.errorMessage !== null){
        modalJSX = <MUIErrorModal />;
    }

    if (!auth.loggedIn) {
        history.push('/login/');
        return null;
    }

    return (
        <div id="register-screen">
            <div id="register-content">
                {/* Lock Icon */}
                <div className="register-icon">
                    <LockOutlinedIcon sx={{ fontSize: 48, color: '#333' }} />
                </div>
                
                {/* Title */}
                <h1 className="register-title">Edit Account</h1>
                
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
                            
                            {/* Buttons - Complete and Cancel */}
                            <div className="edit-account-buttons">
                                <button 
                                    type="submit" 
                                    className={`edit-account-btn ${!isFormValid ? 'edit-account-btn-disabled' : ''}`}
                                    disabled={!isFormValid}
                                >
                                    Complete
                                </button>
                                <button 
                                    type="button" 
                                    className="edit-account-btn edit-account-cancel-btn"
                                    onClick={handleCancel}
                                >
                                    Cancel
                                </button>
                            </div>
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

