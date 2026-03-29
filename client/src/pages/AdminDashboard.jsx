import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X, Users, BookOpen, LogOut, CheckCircle, XCircle, BarChart3, UserCircle, Settings, Bell, Trash2, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import axios from 'axios';
import toast from 'react-hot-toast';

function AdminDashboard() {
  const { notifications, markAllAsRead } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('adminActiveTab') || 'analytics'); // 'approvals', 'students', 'courses', 'quizzes', 'analytics'
  const [resourceFile, setResourceFile] = useState(null);
  const [pendingStudents, setPendingStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [courseResources, setCourseResources] = useState({}); // { courseId: [resources] }
  const [expandedCourses, setExpandedCourses] = useState([]); // [courseId]
  const [loadingResources, setLoadingResources] = useState({}); // { courseId: true/false }
  const [newCourse, setNewCourse] = useState({ title: '', description: '', stream_target: 'both', rich_content: '' });
  const [newResource, setNewResource] = useState({ course_id: '', title: '', description: '', file_url: '', type: 'pdf' });
  const [newQuiz, setNewQuiz] = useState({ course_id: '', title: '', description: '' });
  const [newQuestion, setNewQuestion] = useState({ quiz_id: '', question_text: '', optionA: '', optionB: '', optionC: '', optionD: '', correct_answer: 'A' });
  const [deleteTarget, setDeleteTarget] = useState(null); // { id, courseId, type: 'resource'|'course' }
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user'));
    if (!token || user?.role !== 'admin') {
      navigate('/login');
    } else {
      fetchPendingStudents(token);
      fetchAllStudents(token);
      fetchCourses(token);
      fetchQuizzes(token);
      fetchAnalytics(token);
    }
  }, [navigate]);

  useEffect(() => {
    localStorage.setItem('adminActiveTab', activeTab);
  }, [activeTab]);

  const fetchAnalytics = async (token) => {
    try {
      const res = await axios.get('/api/admin/analytics', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnalytics(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchQuizzes = async (token) => {
    try {
      const res = await axios.get('/api/admin/quizzes', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQuizzes(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCourseResources = async (courseId) => {
    setLoadingResources(prev => ({ ...prev, [courseId]: true }));
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`/api/admin/courses/${courseId}/resources`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCourseResources(prev => ({ ...prev, [courseId]: res.data }));
    } catch (err) {
      console.error('Failed to fetch resources', err);
      toast.error('Failed to load resources');
    } finally {
      setLoadingResources(prev => ({ ...prev, [courseId]: false }));
    }
  };

  const toggleCourseResources = (courseId) => {
    if (expandedCourses.includes(courseId)) {
      setExpandedCourses(prev => prev.filter(id => id !== courseId));
    } else {
      setExpandedCourses(prev => [...prev, courseId]);
      if (!courseResources[courseId]) {
        fetchCourseResources(courseId);
      }
    }
  };

  const handleDeleteResource = async (resourceId, courseId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/admin/delete-resource/${resourceId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Resource deleted');
      setDeleteTarget(null);
      fetchCourseResources(courseId);
    } catch (err) {
      toast.error('Failed to delete resource');
    }
  };

  const handleCreateQuiz = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/admin/quizzes', newQuiz, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Quiz created successfully!');
      setNewQuiz({ course_id: '', title: '', description: '' });
      fetchQuizzes(token);
    } catch (err) {
      toast.error('Failed to create quiz');
    }
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const options = [newQuestion.optionA, newQuestion.optionB, newQuestion.optionC, newQuestion.optionD];
      const correctText = options[newQuestion.correct_answer.charCodeAt(0) - 65];

      await axios.post('/api/admin/questions', {
        quiz_id: newQuestion.quiz_id,
        question_text: newQuestion.question_text,
        options: options,
        correct_answer: correctText
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Question added successfully!');
      setNewQuestion({ quiz_id: newQuestion.quiz_id, question_text: '', optionA: '', optionB: '', optionC: '', optionD: '', correct_answer: 'A' });
    } catch (err) {
      toast.error('Failed to add question');
    }
  };

  const fetchCourses = async (token) => {
    try {
      const res = await axios.get('/api/admin/courses', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCourses(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/admin/courses', newCourse, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Course created successfully!');
      setNewCourse({ title: '', description: '', stream_target: 'both' });
      fetchCourses(token);
    } catch (err) {
      toast.error('Failed to create course');
    }
  };

  const handleAddResource = async (e) => {
    e.preventDefault();
    if (!newResource.course_id) {
      toast.error('Please select a course');
      return;
    }

    if (!resourceFile && !newResource.file_url) {
      toast.error('Please upload a file or provide a URL');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('course_id', newResource.course_id);
      formData.append('title', newResource.title);
      formData.append('description', newResource.description);
      formData.append('type', newResource.type);
      
      console.log('Sending resource to server...', { course_id: newResource.course_id, title: newResource.title });

      if (resourceFile) {
        formData.append('resourceFile', resourceFile);
      } else {
        formData.append('file_url', newResource.file_url);
      }

      await axios.post('/api/admin/resources', formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      toast.success('Resource added successfully!');
      setNewResource({ course_id: '', title: '', description: '', file_url: '', type: 'pdf' });
      setResourceFile(null);
    } catch (err) {
      toast.error('Failed to add resource');
    }
  };

  const fetchPendingStudents = async (token) => {
    try {
      const res = await axios.get('/api/admin/students/pending', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPendingStudents(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAllStudents = async (token) => {
    try {
      const res = await axios.get('/api/admin/students', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAllStudents(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleApproval = async (studentId, status) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/admin/students/${studentId}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Student ${status} successfully!`);
      fetchPendingStudents(token); // refresh list
    } catch (err) {
      toast.error('Failed to update status');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('adminActiveTab');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-transparent flex flex-col md:flex-row animate-premium">
      {/* Mobile Header */}
      <div className="md:hidden glass sticky top-0 z-50 px-4 py-3 flex justify-between items-center">
        <span className="text-xl font-bold text-brand-700">Admin Panel</span>
        <div className="flex items-center gap-2">
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-600 relative"
              >
                <Bell className="w-6 h-6" />
                {notifications.some(n => !n.read) && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                )}
              </button>
              
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-72 glass rounded-2xl p-4 shadow-2xl z-50 border border-brand-100 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="font-bold text-slate-900">Notifications</h4>
                    <button onClick={markAllAsRead} className="text-xs text-brand-500 hover:underline">Mark read</button>
                  </div>
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                    {notifications.length === 0 ? (
                      <p className="text-sm text-slate-500 text-center py-4">All caught up!</p>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className={`p-3 rounded-xl transition-colors ${n.read ? 'bg-transparent' : 'bg-brand-50/50'}`}>
                          <p className="text-sm text-slate-800">{n.text}</p>
                          <p className="text-[10px] text-slate-400 mt-1">{n.time}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-slate-600">
              {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
        </div>
      </div>

      {/* Sidebar - responsive */}
      <aside className={`${isSidebarOpen ? 'block' : 'hidden'} md:block w-full md:w-64 glass md:h-screen sticky top-0 z-40 flex flex-col`}>
        <div className="hidden md:block p-6">
          <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-600 to-brand-900">
            UniSync Admin
          </span>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-2">
          <button 
            onClick={() => {setActiveTab('analytics'); setIsSidebarOpen(false);}}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-colors ${activeTab === 'analytics' ? 'bg-brand-100 text-brand-700 font-semibold' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <BarChart3 className="w-5 h-5" /> Progress
          </button>
          <button 
            onClick={() => {setActiveTab('approvals'); setIsSidebarOpen(false);}}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-colors ${activeTab === 'approvals' ? 'bg-brand-100 text-brand-700 font-semibold' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <CheckCircle className="w-5 h-5" /> Approvals
          </button>
          <button 
            onClick={() => {setActiveTab('students'); setIsSidebarOpen(false);}}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-colors ${activeTab === 'students' ? 'bg-brand-100 text-brand-700 font-semibold' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <Users className="w-5 h-5" /> Students
          </button>
          <button 
            onClick={() => {setActiveTab('courses'); setIsSidebarOpen(false);}}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-colors ${activeTab === 'courses' ? 'bg-brand-100 text-brand-700 font-semibold' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <BookOpen className="w-5 h-5" /> Courses
          </button>
          <button 
            onClick={() => {setActiveTab('quizzes'); setIsSidebarOpen(false);}}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-colors ${activeTab === 'quizzes' ? 'bg-brand-100 text-brand-700 font-semibold' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <CheckCircle className="w-5 h-5" /> Quizzes
          </button>
        </nav>
        
        <div className="p-4 mt-auto border-t border-slate-200/50 space-y-2">

          <button onClick={handleLogout} className="flex items-center gap-2 text-slate-600 hover:text-red-500 transition-colors w-full px-4 py-2">
            <LogOut className="w-5 h-5" /> Log Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 z-10 w-full overflow-x-hidden">
        {/* Search Bar */}
        <div className="mb-8 relative max-w-2xl">
          <input 
            type="text"
            placeholder="Search students, courses, or quizzes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 bg-white outline-none focus:ring-2 focus:ring-brand-500 transition-all shadow-sm"
          />
          <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        </div>
        {activeTab === 'approvals' && (
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Pending Approvals</h2>
            <p className="text-slate-500 mb-8">Review new student applications and payment receipts.</p>
            
            <div className="grid grid-cols-1 gap-6">
              {pendingStudents.filter(s => 
                s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                s.email.toLowerCase().includes(searchTerm.toLowerCase())
              ).length === 0 ? (
                <div className="glass p-8 rounded-2xl text-center text-slate-500">
                  No pending approvals at the moment.
                </div>
              ) : (
                pendingStudents.filter(s => 
                  s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                  s.email.toLowerCase().includes(searchTerm.toLowerCase())
                ).map(student => (
                  <div key={student.id} className="glass p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">{student.name}</h3>
                      <p className="text-slate-600">{student.email}</p>
                      <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold ${student.stream === 'natural' ? 'bg-accent-100 text-accent-700' : 'bg-social-100 text-social-700'}`}>
                        {student.stream.charAt(0).toUpperCase() + student.stream.slice(1)} Stream
                      </span>
                    </div>
                    <div className="flex flex-col sm:items-end gap-2">
                       {/* Helper to handle local vs cloud URLs */}
                       {(() => {
                          const rawPath = String(student.payment_receipt_url || '').trim();
                          const uploadsMatch = rawPath.match(/uploads[/\\](.+)$/);
                          const cleanPath = uploadsMatch ? `uploads/${uploadsMatch[1]}` : rawPath;
                          const fullUrl = /^\/?(https?:)?\/\//.test(cleanPath) ? (cleanPath.startsWith('/') ? cleanPath.substring(1) : cleanPath) : `http://localhost:5000/${cleanPath}`;
                          
                          return (
                            <a 
                              href={fullUrl} 
                              target="_blank" 
                              rel="noreferrer"
                              className="text-sm text-brand-600 hover:underline mb-2"
                            >
                              View Receipt
                            </a>
                          );
                       })()}
                      <div className="flex gap-2">
                        <button onClick={() => handleApproval(student.id, 'approved')} className="flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                          <CheckCircle className="w-4 h-4" /> Approve
                        </button>
                        <button onClick={() => handleApproval(student.id, 'rejected')} className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                          <XCircle className="w-4 h-4" /> Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'students' && (
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Student Directory</h2>
            <p className="text-slate-500 mb-8">View and manage all registered students across all streams.</p>
            
            <div className="glass rounded-3xl overflow-hidden border border-brand-100 shadow-xl bg-white/70">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-brand-100">
                    <th className="px-6 py-4 text-sm font-bold text-slate-700">Student</th>
                    <th className="px-6 py-4 text-sm font-bold text-slate-700">Stream</th>
                    <th className="px-6 py-4 text-sm font-bold text-slate-700">Status</th>
                    <th className="px-6 py-4 text-sm font-bold text-slate-700 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {allStudents.filter(s => 
                    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                    s.email.toLowerCase().includes(searchTerm.toLowerCase())
                  ).length === 0 ? (
                    <tr>
                      <td colSpan="4" className="px-6 py-12 text-center text-slate-500">No students found matching your search.</td>
                    </tr>
                  ) : (
                    allStudents.filter(s => 
                      s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                      s.email.toLowerCase().includes(searchTerm.toLowerCase())
                    ).map(student => (
                      <tr key={student.id} className="hover:bg-brand-50/30 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-800">{student.name}</div>
                          <div className="text-xs text-slate-500">{student.email}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${student.stream === 'natural' ? 'bg-accent-100 text-accent-700' : 'bg-social-100 text-social-700'}`}>
                            {student.stream}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${student.status === 'approved' ? 'bg-green-100 text-green-700' : student.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                            {student.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={async () => {
                                await handleApproval(student.id, student.status === 'approved' ? 'rejected' : 'approved');
                                fetchAllStudents(localStorage.getItem('token'));
                            }}
                            className="text-brand-600 hover:text-brand-900 text-sm font-bold transition-colors"
                          >
                            {student.status === 'approved' ? 'Revoke' : 'Approve'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'courses' && (
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Course Management</h2>
            <p className="text-slate-500 mb-8">Create new courses and add learning modules.</p>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Create Course Form */}
              <div className="glass p-6 rounded-2xl">
                <h3 className="text-xl font-bold text-slate-800 mb-4">Create New Course</h3>
                <form onSubmit={handleCreateCourse} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Title</label>
                    <input type="text" required value={newCourse.title} onChange={e => setNewCourse({...newCourse, title: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none bg-white/50" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                    <textarea required value={newCourse.description} onChange={e => setNewCourse({...newCourse, description: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none bg-white/50 h-24"></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Lesson Content (Markdown Supported)</label>
                    <textarea value={newCourse.rich_content} onChange={e => setNewCourse({...newCourse, rich_content: e.target.value})} placeholder="# Header\n- List item" className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none bg-white/50 h-32 font-mono text-sm"></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Target Stream</label>
                    <select value={newCourse.stream_target} onChange={e => setNewCourse({...newCourse, stream_target: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none bg-white/50">
                      <option value="both">Both Streams</option>
                      <option value="natural">Natural Stream</option>
                      <option value="social">Social Stream</option>
                    </select>
                  </div>
                  <button type="submit" className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 rounded-xl transition-all">Create Course</button>
                </form>
              </div>

              {/* Add Resource Form */}
              <div className="glass p-6 rounded-2xl">
                <h3 className="text-xl font-bold text-slate-800 mb-4">Add Module/Resource</h3>
                <form onSubmit={handleAddResource} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Select Course</label>
                    <select required value={newResource.course_id} onChange={e => setNewResource({...newResource, course_id: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none bg-white/50">
                      <option value="">-- Choose Course --</option>
                      {courses.map(c => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Resource Title</label>
                    <input type="text" required value={newResource.title} onChange={e => setNewResource({...newResource, title: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none bg-white/50" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Resource URL (Optional if uploading)</label>
                      <input type="text" value={newResource.file_url} onChange={e => setNewResource({...newResource, file_url: e.target.value})} placeholder="https://..." className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none bg-white/50" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                      <select value={newResource.type} onChange={e => setNewResource({...newResource, type: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none bg-white/50">
                        <option value="pdf">PDF</option>
                        <option value="video">Video</option>
                        <option value="link">External Link</option>
                        <option value="docx">Word (.docx)</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Upload File (PDF or Word)</label>
                    <input 
                      type="file" 
                      accept=".pdf,.docx"
                      onChange={e => setResourceFile(e.target.files[0])} 
                      className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100" 
                    />
                    {resourceFile && <p className="text-xs text-brand-600 mt-1 font-medium">Selected: {resourceFile.name}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                    <textarea value={newResource.description} onChange={e => setNewResource({...newResource, description: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none bg-white/50 h-20"></textarea>
                  </div>
                  <button type="submit" className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold py-3 rounded-xl transition-all">Add Resource</button>
                </form>
              </div>
            </div>

            <div className="mt-8 glass p-6 rounded-2xl">
              <h3 className="text-xl font-bold text-slate-800 mb-4">Existing Courses</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {courses.filter(c => c.title.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? (
                    <p className="text-slate-500">No matching courses found.</p>
                ) : (
                    courses.filter(c => c.title.toLowerCase().includes(searchTerm.toLowerCase())).map(course => (
                    <div key={course.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-bold text-slate-800">{course.title}</h4>
                            <p className="text-sm text-slate-600 mt-1 line-clamp-2">{course.description}</p>
                            <span className="inline-block mt-3 px-2 py-1 bg-slate-200 text-slate-700 rounded text-xs font-semibold uppercase">{course.stream_target}</span>
                          </div>
                          <button 
                            onClick={() => toggleCourseResources(course.id)}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1 text-slate-500 hover:text-brand-600"
                            title="Manage Resources"
                          >
                            <span className="text-xs font-semibold">Resources</span>
                            {expandedCourses.includes(course.id) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </div>

                        {expandedCourses.includes(course.id) && (
                          <div className="mt-4 pt-4 border-t border-slate-100">
                             {loadingResources[course.id] ? (
                               <div className="flex justify-center py-4">
                                 <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
                               </div>
                             ) : (
                               <div className="space-y-3">
                                 {courseResources[course.id]?.length === 0 ? (
                                   <p className="text-center text-xs text-slate-400 py-2">No resources uploaded yet.</p>
                                 ) : (
                                   courseResources[course.id]?.map(res => (
                                     <div key={res.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                                       <div className="min-w-0 flex-1 pr-4">
                                         <p className="text-sm font-bold text-slate-800 truncate">{res.title}</p>
                                         <p className="text-[10px] text-slate-500 truncate">{res.type}</p>
                                       </div>
                                       <button 
                                         onClick={() => setDeleteTarget({ id: res.id, courseId: course.id, title: res.title, type: 'resource' })}
                                         className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                         title="Delete Resource"
                                       >
                                         <Trash2 className="w-4 h-4" />
                                       </button>
                                     </div>
                                   ))
                                 )}
                               </div>
                             )}
                          </div>
                        )}
                    </div>
                    ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'quizzes' && (
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Quiz Management</h2>
            <p className="text-slate-500 mb-8">Design assessments and attach questions to evaluate student progress.</p>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Create Quiz Form */}
              <div className="glass p-6 rounded-2xl">
                <h3 className="text-xl font-bold text-slate-800 mb-4">Create New Quiz</h3>
                <form onSubmit={handleCreateQuiz} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Select Course</label>
                    <select required value={newQuiz.course_id} onChange={e => setNewQuiz({...newQuiz, course_id: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none bg-white/50">
                      <option value="">-- Choose Course --</option>
                      {courses.map(c => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Quiz Title</label>
                    <input type="text" required value={newQuiz.title} onChange={e => setNewQuiz({...newQuiz, title: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none bg-white/50" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                    <textarea required value={newQuiz.description} onChange={e => setNewQuiz({...newQuiz, description: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none bg-white/50 h-24"></textarea>
                  </div>
                  <button type="submit" className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 rounded-xl transition-all">Create Quiz</button>
                </form>
              </div>

              {/* Add Question Form */}
              <div className="glass p-6 rounded-2xl">
                <h3 className="text-xl font-bold text-slate-800 mb-4">Add Question</h3>
                <form onSubmit={handleAddQuestion} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Select Quiz</label>
                    <select required value={newQuestion.quiz_id} onChange={e => setNewQuestion({...newQuestion, quiz_id: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none bg-white/50">
                      <option value="">-- Choose Quiz --</option>
                      {quizzes.map(q => (
                        <option key={q.id} value={q.id}>{q.title}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Question Text</label>
                    <textarea required value={newQuestion.question_text} onChange={e => setNewQuestion({...newQuestion, question_text: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none bg-white/50 h-16"></textarea>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <input type="text" required placeholder="Option A" value={newQuestion.optionA} onChange={e => setNewQuestion({...newQuestion, optionA: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none bg-white/50" />
                    </div>
                    <div>
                      <input type="text" required placeholder="Option B" value={newQuestion.optionB} onChange={e => setNewQuestion({...newQuestion, optionB: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none bg-white/50" />
                    </div>
                    <div>
                      <input type="text" required placeholder="Option C" value={newQuestion.optionC} onChange={e => setNewQuestion({...newQuestion, optionC: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none bg-white/50" />
                    </div>
                    <div>
                      <input type="text" required placeholder="Option D" value={newQuestion.optionD} onChange={e => setNewQuestion({...newQuestion, optionD: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none bg-white/50" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Correct Answer</label>
                    <select value={newQuestion.correct_answer} onChange={e => setNewQuestion({...newQuestion, correct_answer: e.target.value})} className="w-full px-4 py-2 rounded-xl border border-slate-200 outline-none bg-white/50">
                      <option value="A">Option A</option>
                      <option value="B">Option B</option>
                      <option value="C">Option C</option>
                      <option value="D">Option D</option>
                    </select>
                  </div>
                  <button type="submit" className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold py-3 rounded-xl transition-all">Save Question</button>
                </form>
              </div>
            </div>
            
            <div className="mt-8 glass p-6 rounded-2xl">
              <h3 className="text-xl font-bold text-slate-800 mb-4">Existing Quizzes</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {quizzes.filter(q => q.title.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? (
                    <p className="text-slate-500">No matching quizzes found.</p>
                ) : (
                    quizzes.filter(q => q.title.toLowerCase().includes(searchTerm.toLowerCase())).map(quiz => (
                    <div key={quiz.id} className="bg-white p-4 rounded-xl border border-slate-200">
                        <h4 className="font-bold text-slate-800">{quiz.title}</h4>
                        <p className="text-sm text-slate-600 mt-1 line-clamp-2">{quiz.description}</p>
                    </div>
                    ))
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && analytics && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div>
              <h2 className="text-3xl font-extrabold text-slate-900 mb-2">Platform Analytics</h2>
              <p className="text-slate-500">A high-level overview of enrollment status and academic performance.</p>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="glass p-6 rounded-2xl border border-brand-100">
                <p className="text-slate-500 text-sm font-medium">Total Courses</p>
                <div className="flex items-center justify-between mt-1">
                  <h4 className="text-3xl font-bold text-slate-900">{analytics.counts.courses}</h4>
                  <div className="bg-brand-100 p-2 rounded-lg text-brand-600"><BookOpen className="w-6 h-6" /></div>
                </div>
              </div>
              <div className="glass p-6 rounded-2xl border border-brand-100">
                <p className="text-slate-500 text-sm font-medium">Active Quizzes</p>
                <div className="flex items-center justify-between mt-1">
                  <h4 className="text-3xl font-bold text-slate-900">{analytics.counts.quizzes}</h4>
                  <div className="bg-blue-100 p-2 rounded-lg text-blue-600"><CheckCircle className="w-6 h-6" /></div>
                </div>
              </div>
              <div className="glass p-6 rounded-2xl border border-brand-100">
                <p className="text-slate-500 text-sm font-medium">Approval Rate</p>
                <div className="flex items-center justify-between mt-1">
                  <h4 className="text-3xl font-bold text-slate-900">
                    {analytics.userStats.approved + analytics.userStats.pending + analytics.userStats.rejected > 0 
                      ? Math.round((analytics.userStats.approved / (analytics.userStats.approved + analytics.userStats.pending + analytics.userStats.rejected)) * 100) 
                      : 0}%
                  </h4>
                  <div className="bg-green-100 p-2 rounded-lg text-green-600"><Users className="w-6 h-6" /></div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              {/* User Status Pie Chart */}
              <div className="glass p-6 rounded-2xl min-h-[400px] flex flex-col">
                <h3 className="text-xl font-bold text-slate-800 mb-6">Student Enrollment Status</h3>
                <div className="flex-1 min-h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Approved', value: analytics.userStats.approved },
                          { name: 'Pending', value: analytics.userStats.pending },
                          { name: 'Rejected', value: analytics.userStats.rejected }
                        ]}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        <Cell fill="#0ea5e9" />
                        <Cell fill="#94a3b8" />
                        <Cell fill="#f43f5e" />
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Quiz Performance Bar Chart */}
              <div className="glass p-6 rounded-2xl min-h-[400px] flex flex-col">
                <h3 className="text-xl font-bold text-slate-800 mb-6">Quiz Performance (Avg %)</h3>
                <div className="flex-1 min-h-[300px] w-full">
                   {analytics.performance.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analytics.performance}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="title" hide={analytics.performance.length > 5} />
                          <YAxis domain={[0, 100]} />
                          <Tooltip />
                          <Bar dataKey="avg_score" fill="#6366f1" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                   ) : (
                      <div className="h-full flex items-center justify-center text-slate-400">
                        No quiz data to display yet.
                      </div>
                   )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      {/* Custom Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setDeleteTarget(null)} />
          <div className="glass bg-white max-w-sm w-full p-8 rounded-3xl shadow-2xl relative animate-zoom-in text-center">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trash2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Delete {deleteTarget.type === 'resource' ? 'Resource' : 'Course'}?</h3>
            <p className="text-slate-500 text-sm mb-8">
              Are you sure you want to delete <span className="font-bold text-slate-700">"{deleteTarget.title}"</span>? This action cannot be undone.
            </p>
            <div className="flex gap-4">
              <button 
                onClick={() => setDeleteTarget(null)}
                className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleDeleteResource(deleteTarget.id, deleteTarget.courseId)}
                className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-red-200"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
