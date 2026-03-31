import './VenueCard.css';

const VenueCard = ({ venue, onAction }) => {
    return (
        <div className="venue-card-anim">
            <p className="vc-title">{venue.name}</p>
            <p className="vc-small-desc" style={{ marginBottom: '8px', fontWeight: 'bold' }}>
                {venue.type}
            </p>
            <p className="vc-small-desc">
                Capacity: {venue.capacity} <br />
                Location: {venue.location || 'N/A'}
            </p>
            
            <div className="vc-go-corner" onClick={() => onAction && onAction(venue)}>
                <div className="vc-go-arrow">
                    <i className="fa-solid fa-trash" style={{ fontSize: '0.8rem', color: 'white' }} />
                </div>
            </div>
        </div>
    );
};

export default VenueCard;
