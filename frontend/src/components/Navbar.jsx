import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
    const { user, logout, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const goToDashboard = () => {
        if (user?.role === 'ADMIN') return '/admin';
        if (user?.role === 'FACULTY') return '/faculty';
        return '/dashboard';
    };

    return (
        <header className="header">
            <div className="header-container">
                <div className="header-left">
                    {/* Animated back button from Uiverse.io */}
                    <div className="styled-wrapper">
                        <button className="button" onClick={() => navigate(-1)} title="Go Back">
                            <div className="button-box">
                                <svg className="button-elem" viewBox="0 0 46 40">
                                    <path d="M46 20.038c0-.7-.3-1.5-.8-2.1l-16-17c-1.1-1-3.2-1.4-4.4-.3-1.2 1.1-1.2 3.3 0 4.4l11.3 11.9H3c-1.7 0-3 1.3-3 3s1.3 3 3 3h33.1l-11.3 11.9c-1 1-1.2 3.3 0 4.4 1.2 1.1 3.3.8 4.4-.3l16-17c.5-.5.8-1.1.8-1.9z" />
                                </svg>
                                <svg className="button-elem" viewBox="0 0 46 40">
                                    <path d="M46 20.038c0-.7-.3-1.5-.8-2.1l-16-17c-1.1-1-3.2-1.4-4.4-.3-1.2 1.1-1.2 3.3 0 4.4l11.3 11.9H3c-1.7 0-3 1.3-3 3s1.3 3 3 3h33.1l-11.3 11.9c-1 1-1.2 3.3 0 4.4 1.2 1.1 3.3.8 4.4-.3l16-17c.5-.5.8-1.1.8-1.9z" />
                                </svg>
                            </div>
                        </button>
                    </div>
                    <Link to="/" className="logo">
                        <img src="/logoo.png" alt="Logo" className="logo-image" />
                    </Link>
                </div>

                <div className="header-actions">
                    {isAuthenticated && (
                        <span className="user-info">Hi, {user?.firstName || 'User'}!</span>
                    )}

                    {isAuthenticated ? (
                        <>
                            <Link to={goToDashboard()} className="btn btn-secondary">
                                My Dashboard
                            </Link>
                            <button onClick={logout} className="btn btn-secondary">
                                Logout
                            </button>
                        </>
                    ) : (
                        <>
                            <Link to="/login" className="btn btn-secondary">Sign In</Link>
                            <Link to="/signup" className="btn btn-primary">Create Account</Link>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Navbar;
