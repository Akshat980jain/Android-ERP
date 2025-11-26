import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Users, Clock, Star, Award } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';

interface Event {
  _id: string;
  title: string;
  description: string;
  eventType: string;
  startDate: string;
  endDate: string;
  venue: string;
  maxParticipants?: number;
  registrationDeadline?: string;
  registrationFee: number;
  isRegistered?: boolean;
  registrationStatus?: string;
  canRegister?: boolean;
  registrations: any[];
  speakers: Array<{
    name: string;
    designation: string;
    organization: string;
  }>;
}

export function EventModule() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'registered'>('upcoming');

  useEffect(() => {
    fetchEvents();
  }, [filter]);

  const fetchEvents = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (filter === 'upcoming') params.append('upcoming', 'true');
      
      const res = await fetch(`/api/events?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        let filteredEvents = data.events || [];
        if (filter === 'registered' && user?.role === 'student') {
          filteredEvents = filteredEvents.filter((event: Event) => event.isRegistered);
        }
        setEvents(filteredEvents);
      } else {
        setError(data.message || 'Failed to fetch events');
      }
    } catch {
      setError('Failed to fetch events');
    }
    setLoading(false);
  };

  const registerForEvent = async (eventId: string) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/events/${eventId}/register`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        fetchEvents(); // Refresh events
      } else {
        setError(data.message || 'Failed to register for event');
      }
    } catch {
      setError('Failed to register for event');
    }
  };

  const getEventTypeColor = (type: string) => {
    const colors = {
      workshop: 'bg-blue-100 text-blue-800',
      seminar: 'bg-green-100 text-green-800',
      conference: 'bg-purple-100 text-purple-800',
      cultural: 'bg-pink-100 text-pink-800',
      sports: 'bg-orange-100 text-orange-800',
      academic: 'bg-indigo-100 text-indigo-800',
      placement: 'bg-emerald-100 text-emerald-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[type as keyof typeof colors] || colors.other;
  };

  const isEventUpcoming = (startDate: string) => {
    return new Date(startDate) > new Date();
  };

  const isRegistrationOpen = (event: Event) => {
    const now = new Date();
    const registrationDeadline = event.registrationDeadline ? new Date(event.registrationDeadline) : new Date(event.startDate);
    return now < registrationDeadline && isEventUpcoming(event.startDate);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Calendar className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Events & Activities</h1>
        </div>
        
        <div className="flex items-center space-x-2">
          {(['all', 'upcoming', 'registered'] as const).map((filterType) => (
            <button
              key={filterType}
              onClick={() => setFilter(filterType)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                filter === filterType
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading events...</div>
      ) : events.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
            <p className="text-gray-600">
              {filter === 'registered' ? 'You have not registered for any events yet.' : 'No events available at the moment.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <Card key={event._id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-2">{event.title}</h3>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEventTypeColor(event.eventType)}`}>
                        {event.eventType.charAt(0).toUpperCase() + event.eventType.slice(1)}
                      </span>
                    </div>
                    {event.isRegistered && (
                      <div className="flex items-center text-green-600">
                        <CheckCircle className="w-5 h-5" />
                      </div>
                    )}
                  </div>

                  <p className="text-sm text-gray-700">{event.description}</p>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>{new Date(event.startDate).toLocaleDateString()}</span>
                      {event.startDate !== event.endDate && (
                        <span> - {new Date(event.endDate).toLocaleDateString()}</span>
                      )}
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Clock className="w-4 h-4 mr-2" />
                      <span>{new Date(event.startDate).toLocaleTimeString()}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span>{event.venue}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Users className="w-4 h-4 mr-2" />
                      <span>
                        {event.registrations.length}
                        {event.maxParticipants && ` / ${event.maxParticipants}`} registered
                      </span>
                    </div>
                    {event.registrationFee > 0 && (
                      <div className="flex items-center text-gray-600">
                        <span className="font-medium">Fee: ₹{event.registrationFee}</span>
                      </div>
                    )}
                  </div>

                  {event.speakers && event.speakers.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Speakers:</h4>
                      <div className="space-y-1">
                        {event.speakers.slice(0, 2).map((speaker, index) => (
                          <div key={index} className="text-xs text-gray-600">
                            <span className="font-medium">{speaker.name}</span>
                            {speaker.designation && <span> - {speaker.designation}</span>}
                            {speaker.organization && <span>, {speaker.organization}</span>}
                          </div>
                        ))}
                        {event.speakers.length > 2 && (
                          <div className="text-xs text-gray-500">
                            +{event.speakers.length - 2} more speakers
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {user?.role === 'student' && (
                    <div className="pt-4 border-t border-gray-200">
                      {event.isRegistered ? (
                        <div className="flex items-center justify-center text-green-600 font-medium">
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Registered
                        </div>
                      ) : isRegistrationOpen(event) && event.canRegister ? (
                        <Button
                          onClick={() => registerForEvent(event._id)}
                          className="w-full"
                        >
                          Register Now
                        </Button>
                      ) : (
                        <div className="text-center text-gray-500 text-sm">
                          {!isRegistrationOpen(event) ? 'Registration Closed' : 'Event Full'}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}