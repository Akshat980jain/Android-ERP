import React, { useState, useEffect } from 'react';
import { Bus, MapPin, Clock, Users, Phone, CheckCircle, Satellite } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../utils/api';

interface TransportRoute {
  _id: string;
  routeNumber: string;
  routeName: string;
  driver: {
    name: string;
    phone: string;
  };
  vehicle: {
    number: string;
    type: string;
    capacity: number;
  };
  stops: Array<{
    name: string;
    time: string;
    fare: number;
  }>;
  schedule: {
    morningDeparture: string;
    eveningDeparture: string;
    operatingDays: string[];
  };
  isSubscribed?: boolean;
  subscriptionStatus?: string;
  subscribedStop?: string;
  monthlyFee?: number;
  subscribers: any[];
}

export function TransportModule() {
  const { user } = useAuth();
  const [routes, setRoutes] = useState<TransportRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRoute, setSelectedRoute] = useState<TransportRoute | null>(null);
  const [selectedStop, setSelectedStop] = useState('');
  const [etaByRoute, setEtaByRoute] = useState<Record<string, Array<{ stop: string; etaMinutes: number|null }>>>({});

  useEffect(() => {
    fetchRoutes();
  }, []);

  const fetchRoutes = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiClient.listTransportRoutes() as any;
      setRoutes(data.routes || []);
      // fetch ETA for each route
      const etaEntries = await Promise.all((data.routes||[]).map(async (r: any) => {
        try { const e = await apiClient.getRouteEta(r._id); return [r._id, e.eta]; } catch { return [r._id, []]; }
      }));
      const map: any = {};
      etaEntries.forEach(([id, eta]) => { map[id] = eta; });
      setEtaByRoute(map);
    } catch {
      setError('Failed to fetch routes');
    }
    setLoading(false);
  };

  const subscribeToRoute = async (routeId: string, stop: string) => {
    try {
      await apiClient.subscribeTransportRoute(routeId, stop);
      setSelectedRoute(null);
      setSelectedStop('');
      fetchRoutes();
    } catch {
      setError('Failed to subscribe to route');
    }
  };

  const getVehicleIcon = (type: string) => {
    return <Bus className="w-6 h-6 text-blue-600" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Bus className="w-6 h-6 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900">Transport Management</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading transport routes...</div>
      ) : routes.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Bus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No transport routes</h3>
            <p className="text-gray-600">No transport routes are currently available.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {routes.map((route) => (
            <Card key={route._id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      {getVehicleIcon(route.vehicle.type)}
                      <div>
                        <h3 className="font-semibold text-gray-900">Route {route.routeNumber}</h3>
                        <p className="text-sm text-gray-600">{route.routeName}</p>
                      </div>
                    </div>
                    {route.isSubscribed && (
                      <div className="flex items-center text-green-600">
                        <CheckCircle className="w-5 h-5" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-gray-600">
                      <Bus className="w-4 h-4 mr-2" />
                      <span>{route.vehicle.number} ({route.vehicle.type})</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Users className="w-4 h-4 mr-2" />
                      <span>Capacity: {route.vehicle.capacity}</span>
                    </div>
                    <div className="flex items-center text-gray-600">
                      <Phone className="w-4 h-4 mr-2" />
                      <span>{route.driver.name} - {route.driver.phone}</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Schedule:</h4>
                    <div className="space-y-1 text-xs text-gray-600">
                      <div className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        <span>Morning: {route.schedule.morningDeparture}</span>
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        <span>Evening: {route.schedule.eveningDeparture}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        Operating: {route.schedule.operatingDays.join(', ')}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Stops:</h4>
                    <div className="max-h-32 overflow-y-auto space-y-1">
                      {route.stops.slice(0, 3).map((stop, index) => (
                        <div key={index} className="flex items-center justify-between text-xs">
                          <div className="flex items-center text-gray-600">
                            <MapPin className="w-3 h-3 mr-1" />
                            <span>{stop.name}</span>
                          </div>
                          <div className="text-gray-500">
                            <span>{stop.time}</span>
                            {etaByRoute[route._id]?.find(e=>e.stop===stop.name)?.etaMinutes != null && (
                              <span className="ml-2 inline-flex items-center text-blue-600"><Satellite className="w-3 h-3 mr-1" />{etaByRoute[route._id].find(e=>e.stop===stop.name)?.etaMinutes}m</span>
                            )}
                            <span className="ml-2">₹{stop.fare}</span>
                          </div>
                        </div>
                      ))}
                      {route.stops.length > 3 && (
                        <div className="text-xs text-gray-500">
                          +{route.stops.length - 3} more stops
                        </div>
                      )}
                    </div>
                  </div>

                  {user?.role === 'student' && (
                    <div className="pt-4 border-t border-gray-200">
                      {route.isSubscribed ? (
                        <div className="text-center">
                          <div className="flex items-center justify-center text-green-600 font-medium mb-2">
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Subscribed
                          </div>
                          <div className="text-xs text-gray-600">
                            Stop: {route.subscribedStop}
                          </div>
                          <div className="text-xs text-gray-600">
                            Monthly Fee: ₹{route.monthlyFee}
                          </div>
                        </div>
                      ) : (
                        <Button
                          onClick={() => setSelectedRoute(route)}
                          className="w-full"
                          disabled={route.subscribers.length >= route.vehicle.capacity}
                        >
                          {route.subscribers.length >= route.vehicle.capacity ? 'Route Full' : 'Subscribe'}
                        </Button>
                      )}
                    </div>
                  )}

                  {user?.role === 'admin' && (
                    <div className="pt-4 border-t border-gray-200">
                      <div className="text-center text-sm text-gray-600">
                        {route.subscribers.length}/{route.vehicle.capacity} subscribed
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Subscription Modal */}
      {selectedRoute && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">Subscribe to Route {selectedRoute.routeNumber}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Your Stop
                </label>
                <select
                  value={selectedStop}
                  onChange={(e) => setSelectedStop(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Choose a stop</option>
                  {selectedRoute.stops.map((stop, index) => (
                    <option key={index} value={stop.name}>
                      {stop.name} - {stop.time} (₹{stop.fare * 30}/month)
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-3">
                <Button
                  onClick={() => subscribeToRoute(selectedRoute._id, selectedStop)}
                  disabled={!selectedStop}
                >
                  Subscribe
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedRoute(null);
                    setSelectedStop('');
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}