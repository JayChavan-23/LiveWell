import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '../lib/api';
import { useAuth } from '../auth/AuthProvider';
import AchievementNotification from './AchievementNotification';

// Constants
const CATEGORIES = [
  { value: 'Fitness', label: 'Fitness', color: 'blue' },
  { value: 'Medical', label: 'Medical', color: 'green' },
  { value: 'Social', label: 'Social', color: 'purple' },
  { value: 'Other', label: 'Other', color: 'gray' }
];

const INITIAL_EVENT_STATE = {
  title: '',
  category: 'Fitness',
  date: '',
  startTime: '',
  endTime: '',
  location: {
    name: '',
    address: ''
  },
  imageUrl: ''
};

// Utility functions
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

const formatTime = (timeString) => {
  return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

const getCategoryInfo = (category) => {
  return CATEGORIES.find(cat => cat.value === category) || CATEGORIES[3];
};

const getCategoryBadgeClasses = (color) => {
  const colorMap = {
    blue: 'bg-gradient-to-r from-blue-500 to-blue-600',
    green: 'bg-gradient-to-r from-green-500 to-green-600',
    purple: 'bg-gradient-to-r from-purple-500 to-purple-600',
    gray: 'bg-gradient-to-r from-gray-500 to-gray-600'
  };
  return colorMap[color] || colorMap.gray;
};

// Loading component
const LoadingSpinner = ({ message = "Loading..." }) => (
  <div className="text-center py-8">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
    <p className="text-gray-600">{message}</p>
  </div>
);

// Empty state component
const EmptyState = ({ onCreateEvent }) => (
  <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border border-gray-200">
    <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
      <i className="fi fi-sr-calendar text-3xl text-white"></i>
    </div>
    <h3 className="text-2xl font-bold text-gray-900 mb-3">No Events Yet</h3>
    <p className="text-gray-600 mb-8 max-w-md mx-auto">
      Be the first to create a social event and bring the community together!
    </p>
    <button
      onClick={onCreateEvent}
      className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center space-x-2 mx-auto"
    >
      <i className="fi fi-sr-plus text-lg"></i>
      <span>Create First Event</span>
    </button>
  </div>
);

// Event card component
const EventCard = ({ event, onJoin, onLeave, onViewDetails }) => {
  const categoryInfo = getCategoryInfo(event.category);
  
  return (
    <div
      className="group bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer border border-gray-200/50 overflow-hidden hover:transform hover:-translate-y-1"
      onClick={() => onViewDetails(event)}
    >
      {/* Event Image */}
      <div className="relative h-52 bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
        {event.imageUrl ? (
          <img
            src={event.imageUrl}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-gradient-to-br from-green-50 to-emerald-50">
            <i className="fi fi-sr-calendar text-5xl text-green-400"></i>
          </div>
        )}
        
        {/* Category Badge */}
        <div className="absolute top-4 left-4">
          <span className={`px-3 py-1.5 rounded-full text-xs font-semibold text-white shadow-lg ${getCategoryBadgeClasses(categoryInfo.color)}`}>
            {event.category}
          </span>
        </div>

        {/* Attendee Count Badge */}
        <div className="absolute top-4 right-4">
          <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full flex items-center space-x-1 shadow-lg">
            <i className="fi fi-sr-users text-gray-600 text-xs"></i>
            <span className="text-sm font-semibold text-gray-700">{event.attendeeCount}</span>
          </div>
        </div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      </div>

      {/* Event Details */}
      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-green-600 transition-colors">
          {event.title}
        </h3>
        
        <div className="space-y-3 mb-6">
          <div className="flex items-center text-sm text-gray-600">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
              <i className="fi fi-sr-calendar text-blue-600 text-xs"></i>
            </div>
            <span className="font-medium">{formatDate(event.date)}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
              <i className="fi fi-sr-clock text-green-600 text-xs"></i>
            </div>
            <span className="font-medium">{formatTime(event.startTime)} - {formatTime(event.endTime)}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
              <i className="fi fi-sr-marker text-purple-600 text-xs"></i>
            </div>
            <span className="font-medium truncate">{event.location.name}</span>
          </div>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            event.isAttending ? onLeave(event.id) : onJoin(event.id);
          }}
          className={`w-full py-3 px-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center space-x-2 ${
            event.isAttending
              ? 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 shadow-lg hover:shadow-xl'
              : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl'
          }`}
        >
          <i className={`fi ${event.isAttending ? 'fi-sr-user-minus' : 'fi-sr-user-plus'} text-lg`}></i>
          <span>{event.isAttending ? 'Leave Event' : 'Join Event'}</span>
        </button>
      </div>
    </div>
  );
};

// Create event modal component
const CreateEventModal = ({ isOpen, onClose, onSubmit, eventData, onChange, isSubmitting }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Create Social Event</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <i className="fi fi-sr-cross text-xl"></i>
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Event Title
            </label>
            <input
              type="text"
              value={eventData.title}
              onChange={(e) => onChange('title', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="e.g., Morning Walk at the Park"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={eventData.category}
              onChange={(e) => onChange('category', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              {CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>
              <input
                type="date"
                value={eventData.date}
                onChange={(e) => onChange('date', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Start Time
              </label>
              <input
                type="time"
                value={eventData.startTime}
                onChange={(e) => onChange('startTime', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Time
            </label>
            <input
              type="time"
              value={eventData.endTime}
              onChange={(e) => onChange('endTime', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Venue Name
            </label>
            <input
              type="text"
              value={eventData.location.name}
              onChange={(e) => onChange('locationName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="e.g., Rymill Park"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address
            </label>
            <input
              type="text"
              value={eventData.location.address}
              onChange={(e) => onChange('locationAddress', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="e.g., East Tce, Adelaide SA"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Image URL (Optional)
            </label>
            <input
              type="url"
              value={eventData.imageUrl}
              onChange={(e) => onChange('imageUrl', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Creating...' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Event details modal component
const EventDetailsModal = ({ isOpen, event, onClose, onJoin, onLeave }) => {
  if (!isOpen || !event) return null;

  const categoryInfo = getCategoryInfo(event.category);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-0 w-full max-w-lg shadow-2xl max-h-[85vh] overflow-hidden">
        {/* Modal Header with Image */}
        <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-200">
          {event.imageUrl ? (
            <img
              src={event.imageUrl}
              alt={event.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-gradient-to-br from-green-50 to-emerald-50">
              <i className="fi fi-sr-calendar text-6xl text-green-400"></i>
            </div>
          )}
          
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-gray-600 hover:text-gray-800 hover:bg-white transition-all duration-200 shadow-lg"
          >
            <i className="fi fi-sr-cross text-lg"></i>
          </button>

          {/* Category Badge */}
          <div className="absolute bottom-4 left-4">
            <span className={`px-4 py-2 rounded-full text-sm font-semibold text-white shadow-lg ${getCategoryBadgeClasses(categoryInfo.color)}`}>
              {event.category}
            </span>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-bold text-gray-900">{event.title}</h3>
          </div>

          {/* Event Info */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <i className="fi fi-sr-calendar text-blue-600 text-sm"></i>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 font-medium">Date</div>
                    <div className="text-base font-semibold text-gray-900">{formatDate(event.date)}</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <i className="fi fi-sr-clock text-green-600 text-sm"></i>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 font-medium">Time</div>
                    <div className="text-base font-semibold text-gray-900">
                      {formatTime(event.startTime)} - {formatTime(event.endTime)}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <i className="fi fi-sr-marker text-purple-600 text-sm"></i>
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-gray-500 font-medium">Location</div>
                    <div className="text-base font-semibold text-gray-900">{event.location.name}</div>
                    <div className="text-xs text-gray-600">{event.location.address}</div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <i className="fi fi-sr-users text-orange-600 text-sm"></i>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 font-medium">Attendees</div>
                    <div className="text-base font-semibold text-gray-900">{event.attendeeCount} people</div>
                  </div>
                </div>
              </div>

              {/* Attendees List */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h5 className="text-lg font-bold text-gray-900 mb-3 flex items-center space-x-2">
                  <i className="fi fi-sr-users text-gray-600"></i>
                  <span>Attendees ({event.attendeeCount})</span>
                </h5>
                <div className="space-y-2">
                  {event.attendees?.length > 0 ? (
                    event.attendees.map((attendee, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-white rounded-lg border border-gray-200">
                        <div className="w-8 h-8 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                          <i className="fi fi-sr-user text-white text-xs"></i>
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 flex items-center space-x-2">
                            <span className="text-sm">{attendee.name}</span>
                            {attendee.isHost && (
                              <span className="px-2 py-1 bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs rounded-full font-medium">
                                Host
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      <i className="fi fi-sr-users text-2xl mb-2 block"></i>
                      <p className="text-sm">No attendees yet</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={() => event.isAttending ? onLeave(event.id) : onJoin(event.id)}
                className={`w-full py-3 px-4 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center space-x-2 ${
                  event.isAttending
                    ? 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 shadow-lg hover:shadow-xl'
                    : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 shadow-lg hover:shadow-xl'
                }`}
              >
                <i className={`fi ${event.isAttending ? 'fi-sr-user-minus' : 'fi-sr-user-plus'} text-base`}></i>
                <span>{event.isAttending ? 'Leave Event' : 'Join Event'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main component
const SocialEvents = () => {
  const { user, loading: authLoading } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [newEvent, setNewEvent] = useState(INITIAL_EVENT_STATE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Achievement notification state
  const [achievementNotifications, setAchievementNotifications] = useState([]);
  const [currentAchievement, setCurrentAchievement] = useState(null);
  
  // Function to show achievement notifications
  const showAchievement = (achievement) => {
    setAchievementNotifications(prev => [...prev, achievement]);
  };
  
  // Process achievement queue
  useEffect(() => {
    if (achievementNotifications.length > 0 && !currentAchievement) {
      setCurrentAchievement(achievementNotifications[0]);
      setAchievementNotifications(prev => prev.slice(1));
    }
  }, [achievementNotifications, currentAchievement]);

  // Fetch events from API
  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      console.log('Fetching events...');
      
      const response = await apiFetch('/api/social/events');
      console.log('Events response:', response);
      
      if (response?.success) {
        setEvents(response.events || []);
      } else {
        console.warn('Response not successful:', response);
        setEvents([]);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      
      if (error.message === 'Authentication required') {
        console.log('User not authenticated, skipping event fetch');
      } else if (error.message.includes('Not Found')) {
        console.error('404 ERROR - Endpoint not found!');
      } else if (error.message.includes('Network error')) {
        console.error('NETWORK ERROR - Cannot reach backend');
      }
      
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load events when user is authenticated
  useEffect(() => {
    if (!authLoading && user?.uid) {
      fetchEvents();
    }
  }, [user, authLoading, fetchEvents]);

  // Handle event creation
  const handleCreateEvent = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const response = await apiFetch('/api/social/events', {
        method: 'POST',
        body: newEvent
      });

      if (response?.success) {
        // Show achievement notifications if any
        if (response.newAchievements && response.newAchievements.length > 0) {
          response.newAchievements.forEach(achievement => {
            showAchievement(achievement);
          });
        }
        
        setShowCreateModal(false);
        setNewEvent(INITIAL_EVENT_STATE);
        fetchEvents();
      }
    } catch (error) {
      console.error('Error creating event:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle joining an event
  const handleJoinEvent = async (eventId) => {
    try {
      const response = await apiFetch(`/api/social/events/${eventId}/join`, {
        method: 'POST'
      });

      if (response?.success) {
        // Show achievement notifications if any
        if (response.newAchievements && response.newAchievements.length > 0) {
          response.newAchievements.forEach(achievement => {
            showAchievement(achievement);
          });
        }
        
        fetchEvents();
        if (selectedEvent?.id === eventId) {
          setSelectedEvent(prev => ({
            ...prev,
            isAttending: true,
            attendeeCount: prev.attendeeCount + 1
          }));
        }
      }
    } catch (error) {
      console.error('Error joining event:', error);
    }
  };

  // Handle leaving an event
  const handleLeaveEvent = async (eventId) => {
    try {
      const response = await apiFetch(`/api/social/events/${eventId}/leave`, {
        method: 'DELETE'
      });

      if (response?.success) {
        fetchEvents();
        if (selectedEvent?.id === eventId) {
          setSelectedEvent(prev => ({
            ...prev,
            isAttending: false,
            attendeeCount: prev.attendeeCount - 1
          }));
        }
      }
    } catch (error) {
      console.error('Error leaving event:', error);
    }
  };

  // Handle opening event details modal
  const openEventModal = (event) => {
    setSelectedEvent(event);
    setShowEventModal(true);
  };

  // Handle form field changes
  const handleEventChange = (field, value) => {
    if (field === 'locationName') {
      setNewEvent(prev => ({
        ...prev,
        location: { ...prev.location, name: value }
      }));
    } else if (field === 'locationAddress') {
      setNewEvent(prev => ({
        ...prev,
        location: { ...prev.location, address: value }
      }));
    } else {
      setNewEvent(prev => ({ ...prev, [field]: value }));
    }
  };

  // Loading states
  if (authLoading) {
    return <LoadingSpinner message="Authenticating..." />;
  }

  if (loading) {
    return <LoadingSpinner message="Loading social events..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-r from-emerald-400 to-green-500 rounded-full shadow-lg flex items-center justify-center">
            <i className="fi fi-sr-calendar text-white text-lg"></i>
          </div>
          <div>
            <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 via-emerald-600 to-green-600 bg-clip-text text-transparent">
              Social Events
            </h2>
            <p className="text-gray-600 font-medium">Join community events and connect with others</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center space-x-2"
        >
          <i className="fi fi-sr-plus text-lg"></i>
          <span>Create Event</span>
        </button>
      </div>

      {/* Events Grid */}
      {events.length === 0 ? (
        <EmptyState onCreateEvent={() => setShowCreateModal(true)} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onJoin={handleJoinEvent}
              onLeave={handleLeaveEvent}
              onViewDetails={openEventModal}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <CreateEventModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateEvent}
        eventData={newEvent}
        onChange={handleEventChange}
        isSubmitting={isSubmitting}
      />

      <EventDetailsModal
        isOpen={showEventModal}
        event={selectedEvent}
        onClose={() => setShowEventModal(false)}
        onJoin={handleJoinEvent}
        onLeave={handleLeaveEvent}
      />
      
      {/* Achievement Notification */}
      {currentAchievement && (
        <AchievementNotification
          achievement={currentAchievement}
          onClose={() => setCurrentAchievement(null)}
        />
      )}
    </div>
  );
};

export default SocialEvents;