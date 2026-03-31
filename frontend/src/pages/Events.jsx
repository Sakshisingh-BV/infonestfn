import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { eventsAPI, studentAPI, clubsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import EventFlipCard from '../components/EventFlipCard';
import { isEventExpired } from './Clubs';
import './Events.css';
import '../components/EventFlipCard.css';

const Events = () => {
    const { user, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [clubs, setClubs] = useState([]);
    const [registrations, setRegistrations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchData();
    }, [user]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [eventsRes, clubsRes] = await Promise.all([
                eventsAPI.getUpcomingEvents(),
                clubsAPI.getAllClubs()
            ]);
            const upcomingOnly = (eventsRes.data || []).filter(e => !isEventExpired(e));
            setEvents(upcomingOnly);
            setClubs(clubsRes.data);

            if (isAuthenticated && user?.userId) {
                const regsRes = await studentAPI.getMyRegistrations(user.userId);
                setRegistrations(regsRes.data);
            }
        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    const isRegistered = (eventId) => {
        return registrations.some(reg => reg.eventId === eventId);
    };

    const handleRegister = async (event) => {
        // If not authenticated, save intent and redirect to login
        if (!isAuthenticated) {
            sessionStorage.setItem('pendingRegistration', JSON.stringify({
                eventId: event.eventId,
                eventName: event.eventName,
                registrationFormLink: event.registrationFormLink || 'club_form_link'
            }));
            navigate('/login');
            return;
        }

        // FLOW A: Internal Form (club_form_link or no link)
        if (!event.registrationFormLink || event.registrationFormLink === 'club_form_link') {
            sessionStorage.setItem('pendingRegistration', JSON.stringify({
                eventId: event.eventId,
                eventName: event.eventName,
                registrationFormLink: 'club_form_link'
            }));
            navigate('/club-form');
            return;
        }

        // FLOW B: External Link - Register first, then redirect
        try {
            const registration = { userId: user.userId, eventId: event.eventId };
            await studentAPI.registerForEvent(registration);

            setMessage({ type: 'success', text: `Registered! Opening external form...` });
            window.open(event.registrationFormLink, '_blank');
            fetchData();
        } catch (error) {
            const errorMsg = error.response?.data?.error || 'Registration failed';
            setMessage({ type: 'error', text: errorMsg });
        }
    };

    const goToDashboard = () => {
        if (user?.role === 'ADMIN') window.location.href = '/admin';
        else if (user?.role === 'FACULTY') window.location.href = '/faculty';
        else window.location.href = '/dashboard';
    };

    if (loading) {
        return (
            <div className="events-page">
                <div className="loading-container">
                    <div className="loader"></div>
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="events-page page-container">
            {/* Header */}
            <header className="page-header">
                <h1><i className="fa-solid fa-ticket" style={{ marginRight: '0.6rem', color: 'var(--primary)' }} />Events</h1>
            </header>

            <div style={{ height: '1.5rem' }} />


            {message.text && (
                <div className={`alert alert-${message.type}`}>
                    {message.text}
                    <button onClick={() => setMessage({ type: '', text: '' })}>×</button>
                </div>
            )}

            {/* Clubs Section */}
            <h2 className="section-title">
                <i className="fa-solid fa-users-rectangle clubs-title-icon" style={{ marginRight: '0.5rem' }} />
                Clubs
            </h2>
            <div className="clubs-grid">
                {clubs.length > 0 ? (
                    clubs.map(club => (
                        <div
                            key={club.clubId}
                            className="club-ui-card"
                            onClick={() => window.location.href = `/clubs/${club.clubId}`}
                        >
                            <svg className="wave" viewBox="0 0 1440 320" xmlns="http://www.w3.org/2000/svg">
                                <path d="M0,256L48,229.3C96,203,192,149,288,154.7C384,160,480,224,576,218.7C672,213,768,139,864,128C960,117,1056,171,1152,197.3C1248,224,1344,224,1392,224L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
                            </svg>
                            <div className="icon-container">
                                <svg className="icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path fill="currentColor" d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM216 336h24V272H216c-13.3 0-24-10.7-24-24s10.7-24 24-24h24V168c0-13.3 10.7-24 24-24s24 10.7 24 24v56h24c13.3 0 24 10.7 24 24s-10.7 24-24 24H288v64h24c13.3 0 24 10.7 24 24s-10.7 24-24 24H216c-13.3 0-24-10.7-24-24s10.7-24 24-24z"/></svg>
                            </div>
                            <div className="message-text-container">
                                <p className="message-text">{club.clubName}</p>
                                <p className="sub-text">View Details</p>
                            </div>
                            <svg className="cross-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><path fill="currentColor" d="M278.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-160 160c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L210.7 256 73.4 118.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l160 160z"/></svg>
                        </div>
                    ))
                ) : (
                    <div className="club-ui-card">
                        <div className="message-text-container">
                            <p className="message-text">No clubs found.</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Events Section */}
            <h2 className="section-title"><i className="fa-solid fa-calendar-days" style={{ marginRight: '0.5rem' }} />Upcoming Events</h2>
            <div className="events-grid">
                {events.length > 0 ? (
                    events.map((event, index) => (
                        <EventFlipCard
                            key={event.eventId}
                            event={event}
                            index={index}
                            onAction={(evt) => handleRegister(evt)}
                        />
                    ))
                ) : (
                    <div className="event-card">
                        <div className="event-body"><p>No upcoming events.</p></div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Events;
