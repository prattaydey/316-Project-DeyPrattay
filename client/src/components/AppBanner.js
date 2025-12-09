import { useContext, useState } from 'react';
import { Link, useLocation } from 'react-router-dom'
import AuthContext from '../auth';
import { GlobalStoreContext } from '../store'

import EditToolbar from './EditToolbar'

import AccountCircle from '@mui/icons-material/AccountCircle';
import HomeIcon from '@mui/icons-material/Home';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';

export default function AppBanner() {
    const { auth } = useContext(AuthContext);
    const { store } = useContext(GlobalStoreContext);
    const [anchorEl, setAnchorEl] = useState(null);
    const isMenuOpen = Boolean(anchorEl);
    const location = useLocation();

    const handleProfileMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        handleMenuClose();
        auth.logoutUser();
    }

    const handleHouseClick = () => {
        store.closeCurrentList();
    }

    const menuId = 'primary-search-account-menu';
    const loggedOutMenu = (
        <Menu
            anchorEl={anchorEl}
            anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
            }}
            id={menuId}
            keepMounted
            transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
            }}
            open={isMenuOpen}
            onClose={handleMenuClose}
        >
            <MenuItem onClick={handleMenuClose}><Link to='/login/'>Login</Link></MenuItem>
            <MenuItem onClick={handleMenuClose}><Link to='/register/'>Create New Account</Link></MenuItem>
        </Menu>
    );
    const loggedInMenu = 
        <Menu
            anchorEl={anchorEl}
            anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
            }}
            id={menuId}
            keepMounted
            transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
            }}
            open={isMenuOpen}
            onClose={handleMenuClose}
        >
            <MenuItem onClick={handleMenuClose}><Link to='/edit-account/'>Edit Account</Link></MenuItem>
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
        </Menu>        

    let editToolbar = "";
    let menu = loggedOutMenu;
    if (auth.loggedIn) {
        menu = loggedInMenu;
        if (store.currentList) {
            editToolbar = <EditToolbar />;
        }
    }
    
    function getAccountMenu(loggedIn) {
        if (loggedIn && auth.user) {
            // If user has an avatar, display it
            if (auth.user.avatarImage) {
                return (
                    <img 
                        src={auth.user.avatarImage} 
                        alt="User avatar" 
                        style={{ 
                            width: '100%', 
                            height: '100%', 
                            objectFit: 'cover',
                            borderRadius: '50%'
                        }} 
                    />
                );
            }
            // Otherwise show initials
            let userInitials = auth.getUserInitials();
            return <div style={{ color: '#333', fontWeight: 'bold', fontSize: '14px' }}>{userInitials}</div>;
        }
        // Not logged in - show default icon
        return <AccountCircle sx={{ color: '#333', fontSize: 28 }} />;
    }

    return (
        <Box sx={{flexGrow: 1}}>
            <AppBar position="static" sx={{ 
                background: '#e040fb',
                boxShadow: 'none'
            }}>
                <Toolbar sx={{ minHeight: '64px' }}>
                    {/* Home Button with white circle background */}
                    <Link onClick={handleHouseClick} to='/' style={{ textDecoration: 'none' }}>
                        <Box sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            backgroundColor: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '2px solid #333'
                        }}>
                            <HomeIcon sx={{ color: '#333', fontSize: 24 }} />
                        </Box>
                    </Link>
                    
                    {/* Navigation Tabs - only show when logged in */}
                    {auth.loggedIn && (
                        <Box sx={{ display: 'flex', ml: 2, gap: 1 }}>
                            <Button
                                component={Link}
                                to="/playlists"
                                sx={{
                                    backgroundColor: location.pathname === '/playlists' ? '#9c27b0' : '#7b1fa2',
                                    color: 'white',
                                    borderRadius: '20px',
                                    px: 2,
                                    py: 0.5,
                                    fontSize: '12px',
                                    textTransform: 'none',
                                    '&:hover': {
                                        backgroundColor: '#9c27b0'
                                    }
                                }}
                            >
                                Playlists
                            </Button>
                            <Button
                                component={Link}
                                to="/songs"
                                sx={{
                                    backgroundColor: location.pathname === '/songs' ? '#9c27b0' : '#7b1fa2',
                                    color: 'white',
                                    borderRadius: '20px',
                                    px: 2,
                                    py: 0.5,
                                    fontSize: '12px',
                                    textTransform: 'none',
                                    '&:hover': {
                                        backgroundColor: '#9c27b0'
                                    }
                                }}
                            >
                                Song Catalog
                            </Button>
                        </Box>
                    )}
                    
                    {/* Title - centered */}
                    <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'center' }}>
                        <Typography 
                            variant="h5" 
                            sx={{ 
                                color: 'white', 
                                fontWeight: 500,
                                fontFamily: '"Lexend Exa", sans-serif'
                            }}
                        >
                            The Playlister
                        </Typography>
                    </Box>
                    
                    {/* Account Button with white circle background */}
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <IconButton
                            size="large"
                            edge="end"
                            aria-label="account of current user"
                            aria-controls={menuId}
                            aria-haspopup="true"
                            onClick={handleProfileMenuOpen}
                            sx={{
                                padding: 0,
                                width: 40,
                                height: 40,
                                borderRadius: '50%',
                                backgroundColor: 'white',
                                border: '2px solid #333',
                                overflow: 'hidden',
                                '&:hover': {
                                    backgroundColor: '#f5f5f5'
                                }
                            }}
                        >
                            { getAccountMenu(auth.loggedIn) }
                        </IconButton>
                    </Box>
                </Toolbar>
            </AppBar>
            {
                menu
            }
        </Box>
    );
}