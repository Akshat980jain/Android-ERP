import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Edit, Trash2, Calendar, Clock } from 'lucide-react';
import apiClient from '../../utils/api';

interface ImportantDate {
  event: string;
  startDate: string;
  endDate?: string;
  description?: string;
}

interface Semester {
  semesterNumber: number;
  semesterType: 'Odd' | 'Even';
  startDate: string;
  endDate: string;
  importantDates: ImportantDate[];
}

interface AcademicCalendar {
  _id?: string;
  academicYear: string;
  semesters: Semester[];
  isActive: boolean;
}

export function CalendarModule() {
  const { user } = useAuth();
  const [calendar, setCalendar] = useState<AcademicCalendar | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Admin management state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCalendar, setEditingCalendar] = useState<AcademicCalendar | null>(null);
  const [calendarForm, setCalendarForm] = useState<AcademicCalendar>({
    academicYear: '',
    semesters: [],
    isActive: true
  });

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true); setError('');
    try {
      const res = await apiClient.getAcademicCalendar() as { success: boolean; calendar: AcademicCalendar | null };
      setCalendar(res.calendar || null);
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed to load calendar'); }
    finally { setLoading(false); }
  };

  const resetForm = () => {
    setCalendarForm({
      academicYear: '',
      semesters: [],
      isActive: true
    });
    setEditingCalendar(null);
    setShowCreateForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (calendarForm.semesters.length === 0) {
      setError('Please add at least one semester');
      return;
    }

    try {
      if (editingCalendar?._id) {
        await apiClient.updateCalendar(editingCalendar._id, calendarForm);
      } else {
        await apiClient.createCalendar(calendarForm);
      }
      resetForm();
      await load();
      setSuccess(editingCalendar ? 'Calendar updated successfully!' : 'Calendar created successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save calendar');
    }
  };

  const addSemester = () => {
    const newSemester: Semester = {
      semesterNumber: calendarForm.semesters.length + 1,
      semesterType: calendarForm.semesters.length % 2 === 0 ? 'Odd' : 'Even',
      startDate: '',
      endDate: '',
      importantDates: []
    };
    setCalendarForm(prev => ({
      ...prev,
      semesters: [...prev.semesters, newSemester]
    }));
  };

  const updateSemester = (index: number, field: keyof Semester, value: string | number | boolean | ImportantDate[]) => {
    setCalendarForm(prev => ({
      ...prev,
      semesters: prev.semesters.map((sem, i) => 
        i === index ? { ...sem, [field]: value } : sem
      )
    }));
  };

  const removeSemester = (index: number) => {
    setCalendarForm(prev => ({
      ...prev,
      semesters: prev.semesters.filter((_, i) => i !== index)
    }));
  };

  const addImportantDate = (semesterIndex: number) => {
    const newDate: ImportantDate = {
      event: '',
      startDate: '',
      endDate: '',
      description: ''
    };
    updateSemester(semesterIndex, 'importantDates', [
      ...calendarForm.semesters[semesterIndex].importantDates,
      newDate
    ]);
  };

  const updateImportantDate = (semesterIndex: number, dateIndex: number, field: keyof ImportantDate, value: string) => {
    const semester = calendarForm.semesters[semesterIndex];
    const updatedDates = semester.importantDates.map((date, i) => 
      i === dateIndex ? { ...date, [field]: value } : date
    );
    updateSemester(semesterIndex, 'importantDates', updatedDates);
  };

  const removeImportantDate = (semesterIndex: number, dateIndex: number) => {
    const semester = calendarForm.semesters[semesterIndex];
    const updatedDates = semester.importantDates.filter((_, i) => i !== dateIndex);
    updateSemester(semesterIndex, 'importantDates', updatedDates);
  };

  const editCalendar = (cal: AcademicCalendar) => {
    setEditingCalendar(cal);
    setCalendarForm({
      academicYear: cal.academicYear,
      semesters: cal.semesters,
      isActive: cal.isActive
    });
    setShowCreateForm(true);
  };

  const deleteCalendar = async (calendarId: string) => {
    if (!confirm('Are you sure you want to delete this calendar?')) return;
    try {
      await apiClient.deleteCalendar(calendarId);
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to delete calendar');
    }
    finally { setLoading(false); }
  };

  if (loading) return <div>Loading calendar...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  if (showCreateForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">{editingCalendar ? 'Edit Academic Calendar' : 'Create New Academic Calendar'}</h2>
          <button className="px-4 py-2 text-gray-600 hover:text-gray-800" onClick={resetForm}>Cancel</button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Academic Year</label>
              <input
                type="text"
                required
                placeholder="e.g., 2024-2025"
                className="w-full border rounded p-2"
                value={calendarForm.academicYear}
                onChange={(e) => setCalendarForm(prev => ({ ...prev, academicYear: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                className="w-full border rounded p-2"
                value={calendarForm.isActive.toString()}
                onChange={(e) => setCalendarForm(prev => ({ ...prev, isActive: e.target.value === 'true' }))}
              >
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Semesters</h3>
              <button
                type="button"
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                onClick={addSemester}
              >
                Add Semester
              </button>
            </div>
            
            <div className="space-y-4">
              {calendarForm.semesters.map((semester, index) => (
                <div key={index} className="p-4 border rounded bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-medium">Semester {semester.semesterNumber}</span>
                    <button
                      type="button"
                      className="text-red-600 hover:text-red-800"
                      onClick={() => removeSemester(index)}
                    >
                      Remove
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Type</label>
                      <select
                        className="w-full border rounded p-2"
                        value={semester.semesterType}
                        onChange={(e) => updateSemester(index, 'semesterType', e.target.value)}
                      >
                        <option value="Odd">Odd</option>
                        <option value="Even">Even</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Start Date</label>
                      <input
                        type="date"
                        required
                        className="w-full border rounded p-2"
                        value={semester.startDate}
                        onChange={(e) => updateSemester(index, 'startDate', e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">End Date</label>
                      <input
                        type="date"
                        required
                        className="w-full border rounded p-2"
                        value={semester.endDate}
                        onChange={(e) => updateSemester(index, 'endDate', e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Important Dates</span>
                      <button
                        type="button"
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                        onClick={() => addImportantDate(index)}
                      >
                        Add Date
                      </button>
                    </div>
                    
                    <div className="space-y-2">
                      {semester.importantDates.map((date, dateIndex) => (
                        <div key={dateIndex} className="p-3 border rounded bg-white">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">Date {dateIndex + 1}</span>
                            <button
                              type="button"
                              className="text-red-600 hover:text-red-800 text-sm"
                              onClick={() => removeImportantDate(index, dateIndex)}
                            >
                              Remove
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <input
                              type="text"
                              placeholder="Event name"
                              className="border rounded p-2 text-sm"
                              value={date.event}
                              onChange={(e) => updateImportantDate(index, dateIndex, 'event', e.target.value)}
                            />
                            <input
                              type="date"
                              className="border rounded p-2 text-sm"
                              value={date.startDate}
                              onChange={(e) => updateImportantDate(index, dateIndex, 'startDate', e.target.value)}
                            />
                            <input
                              type="date"
                              placeholder="End date (optional)"
                              className="border rounded p-2 text-sm"
                              value={date.endDate || ''}
                              onChange={(e) => updateImportantDate(index, dateIndex, 'endDate', e.target.value)}
                            />
                            <input
                              type="text"
                              placeholder="Description (optional)"
                              className="border rounded p-2 text-sm"
                              value={date.description || ''}
                              onChange={(e) => updateImportantDate(index, dateIndex, 'description', e.target.value)}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex gap-4">
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {editingCalendar ? 'Update Calendar' : 'Create Calendar'}
            </button>
            <button
              type="button"
              className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              onClick={resetForm}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Academic Calendar</h2>
        {user?.role === 'admin' && (
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={() => setShowCreateForm(true)}
          >
            <Plus className="w-4 h-4 mr-2 inline" />
            Create Calendar
          </button>
        )}
      </div>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      {!calendar ? (
        <div className="text-gray-500">No academic calendar found.</div>
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold">{calendar.academicYear}</h3>
              <p className="text-sm text-gray-600">
                Status: <span className={`font-medium ${calendar.isActive ? 'text-green-600' : 'text-red-600'}`}>
                  {calendar.isActive ? 'Active' : 'Inactive'}
                </span>
              </p>
            </div>
            {user?.role === 'admin' && (
              <div className="flex gap-2">
                <button
                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                  onClick={() => editCalendar(calendar)}
                >
                  <Edit className="w-4 h-4 mr-1 inline" />
                  Edit
                </button>
                <button
                  className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                  onClick={() => deleteCalendar(calendar._id!)}
                >
                  <Trash2 className="w-4 h-4 mr-1 inline" />
                  Delete
                </button>
              </div>
            )}
          </div>

          {calendar.semesters?.map((sem: Semester) => (
            <div key={sem.semesterNumber} className="bg-white rounded border p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-lg font-semibold flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-blue-600" />
                    Semester {sem.semesterNumber} ({sem.semesterType})
                  </h4>
                  <p className="text-sm text-gray-600">
                    <Clock className="w-4 h-4 mr-1 inline" />
                    {new Date(sem.startDate).toLocaleDateString()} - {new Date(sem.endDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div className="mt-4">
                <h5 className="font-medium mb-3 text-gray-800">Important Dates</h5>
                {sem.importantDates?.length ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {sem.importantDates.map((date, i) => (
                      <div key={i} className="p-3 bg-gray-50 rounded border">
                        <div className="font-medium text-gray-900">{date.event}</div>
                        <div className="text-sm text-gray-600">
                          {new Date(date.startDate).toLocaleDateString()}
                          {date.endDate && ` - ${new Date(date.endDate).toLocaleDateString()}`}
                        </div>
                        {date.description && (
                          <div className="text-sm text-gray-700 mt-1">{date.description}</div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">No important dates scheduled</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


