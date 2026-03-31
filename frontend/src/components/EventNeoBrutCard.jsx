import { motion } from 'framer-motion';

/**
 * Neobrutalist Event Card — used ONLY on the public /events page.
 * Other dashboards continue using EventFlipCard.
 */
const EventNeoBrutCard = ({ event, index, onAction, showDelete }) => {
  const formattedDate = event.eventDate
    ? new Date(event.eventDate + 'T00:00:00').toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
      })
    : 'TBD';

  const deadlineDate = event.deadline
    ? new Date(event.deadline + 'T00:00:00').toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
      })
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.08, ease: [0.16, 1, 0.3, 1] }}
      style={{ display: 'flex', justifyContent: 'center' }}
    >
      <div
        className="neo-card"
        onClick={() => !showDelete && onAction && onAction(event)}
      >
        {/* Date Badge */}
        <span className="neo-card__date-badge">{formattedDate}</span>

        {/* Title */}
        <span className="neo-card__title">{event.eventName}</span>
        <p className="neo-card__club">
          {event.clubId ? `by ${event.clubId}` : 'Campus Event'}
        </p>

        {/* Info grid */}
        <div className="neo-card__info">
          {event.eventTime && (
            <div className="neo-card__info-item">
              <span>⏰</span> {event.eventTime}
            </div>
          )}
          {event.venueId && (
            <div className="neo-card__info-item">
              <span>📍</span> {event.venueId}
            </div>
          )}
          {event.capacity && (
            <div className="neo-card__info-item">
              <span>👥</span> Cap: {event.capacity}
            </div>
          )}
          {deadlineDate && (
            <div className="neo-card__info-item">
              <span>📝</span> Due: {deadlineDate}
            </div>
          )}
        </div>

        {/* Description */}
        <p className="neo-card__content">
          {event.description || 'Join this exciting event on campus. See you there!'}
        </p>

        {/* Action Buttons */}
        {showDelete ? (
          <button
            className="neo-card__button neo-card__button--delete"
            onClick={(e) => {
              e.stopPropagation();
              onAction && onAction(event);
            }}
          >
            🗑️ Delete
          </button>
        ) : (
          onAction && (
            <button
              className="neo-card__button"
              onClick={(e) => {
                e.stopPropagation();
                onAction(event);
              }}
            >
              Register
            </button>
          )
        )}
      </div>
    </motion.div>
  );
};

export default EventNeoBrutCard;
