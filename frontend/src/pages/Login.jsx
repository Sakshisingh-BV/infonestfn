import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

/* ── Allowed email domains (must match backend) ── */
const ALLOWED_DOMAINS = ['@banasthali.in', '@gmail.com'];

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    /* ── Client-side validation ── */
    const validateForm = () => {
        if (!email.trim()) return 'Email is required!';

        // Email domain check
        const lowerEmail = email.trim().toLowerCase();
        const domainOk = ALLOWED_DOMAINS.some(d => lowerEmail.endsWith(d));
        if (!domainOk) return 'Only @banasthali.in or @gmail.com emails are allowed!';

        if (!password) return 'Password is required!';

        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const validationError = validateForm();
        if (validationError) {
            setError(validationError);
            return;
        }

        setLoading(true);

        const result = await login(email.trim(), password);

        if (result.success) {
            // Route based on role
            const role = result.user?.role;
            if (role === 'ADMIN') navigate('/admin');
            else if (role === 'FACULTY') navigate('/faculty');
            else if (role === 'OFFICE') navigate('/office');
            else navigate('/dashboard');
        } else {
            // Parse error — backend sends strings like "Error: Email not registered..."
            let msg = result.error || 'Login failed';
            if (typeof msg === 'string') {
                // Clean up the "Error: " prefix for nicer display
                msg = msg.replace(/^Error:\s*/i, '');
            }
            setError(msg);
        }
        setLoading(false);
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="logo">
                    <h1>Welcome back! Sign in to continue</h1>
                </div>

                {error && (
                    <div className="error-message">{error}</div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="email">Email Address</label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@banasthali.in or @gmail.com"
                            required
                        />
                        <p className="password-hint">Only @banasthali.in or @gmail.com emails accepted</p>
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Password</label>
                        <div className="input-wrapper">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                required
                            />
                            <button
                                type="button"
                                className="eye-btn"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{ fontSize: '0.75rem', fontWeight: 'bold' }}
                            >
                                {showPassword ? 'HIDE' : 'SHOW'}
                            </button>
                        </div>
                        <div style={{ textAlign: 'right', marginTop: '8px' }}>
                            <Link
                                to="/forgot-password"
                                style={{ fontSize: '0.85rem', color: 'var(--primary-color, #007bff)', textDecoration: 'none' }}
                            >
                                Forgot Password?
                            </Link>
                        </div>
                    </div>

                    <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                        {loading ? 'Signing In...' : 'Sign In'}
                    </button>
                </form>

                <div className="divider">
                    <span>or</span>
                </div>

                <div className="links">
                    <p>Don't have an account? <Link to="/signup">Create Account</Link></p>
                    <p style={{ marginTop: '0.75rem' }}><Link to="/events">Browse Events →</Link></p>
                </div>
            </div>
        </div>
    );
};

export default Login;
