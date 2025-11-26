import React, { useEffect, useState } from 'react';
import { Building2, Users, UserPlus, ClipboardList } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import apiClient from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';

interface HostelRoom { number: string; capacity: number; occupants: Array<{ _id: string; name?: string }>; }
interface Hostel { _id: string; name: string; block: string; gender: string; rooms: HostelRoom[]; visitors: any[]; }

export function HostelModule() {
  const { user } = useAuth();
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [allocHostelId, setAllocHostelId] = useState<string>('');
  const [allocRoom, setAllocRoom] = useState<string>('');
  const [allocStudentId, setAllocStudentId] = useState<string>('');

  useEffect(() => { fetchHostels(); }, []);

  const fetchHostels = async () => {
    setLoading(true); setError('');
    try {
      const data = await apiClient.listHostels() as any;
      setHostels(data.hostels || []);
    } catch {
      setError('Failed to load hostels');
    }
    setLoading(false);
  };

  const allocate = async () => {
    if (!allocHostelId || !allocRoom || !allocStudentId) return;
    try {
      await apiClient.allocateHostel(allocHostelId, allocRoom, allocStudentId);
      setAllocHostelId(''); setAllocRoom(''); setAllocStudentId('');
      fetchHostels();
    } catch {
      setError('Allocation failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <Building2 className="w-6 h-6 text-purple-600" />
        <h1 className="text-2xl font-bold text-gray-900">Hostel Management</h1>
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">{error}</div>}

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading hostels...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {hostels.map(h => (
            <Card key={h._id}>
              <CardHeader>
                <CardTitle>{h.name} • Block {h.block} ({h.gender})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-gray-700 flex items-center"><Users className="w-4 h-4 mr-2" /> Rooms: {h.rooms.length}</div>
                  <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
                    {h.rooms.map(r => (
                      <div key={r.number} className="border rounded p-2 text-xs">
                        <div className="font-medium">Room {r.number}</div>
                        <div>Capacity: {r.capacity}</div>
                        <div>Occupants: {r.occupants.length}</div>
                      </div>
                    ))}
                  </div>
                  {user?.role === 'admin' && (
                    <div className="border-t pt-3 mt-2">
                      <div className="text-sm font-medium mb-2 flex items-center"><UserPlus className="w-4 h-4 mr-2" /> Allocate Room</div>
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                        <select value={allocHostelId} onChange={e=>setAllocHostelId(e.target.value)} className="border rounded px-2 py-1">
                          <option value="">Hostel</option>
                          {hostels.map(x => <option key={x._id} value={x._id}>{x.name}-{x.block}</option>)}
                        </select>
                        <input value={allocRoom} onChange={e=>setAllocRoom(e.target.value)} placeholder="Room No" className="border rounded px-2 py-1" />
                        <input value={allocStudentId} onChange={e=>setAllocStudentId(e.target.value)} placeholder="Student ID" className="border rounded px-2 py-1" />
                        <Button onClick={allocate} className="flex items-center justify-center"><ClipboardList className="w-4 h-4 mr-1" /> Assign</Button>
                      </div>
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


