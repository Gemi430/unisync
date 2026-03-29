import { Menu, X, BookOpen, Layers, LogOut, Download, User, Edit2, Save, Camera, Bell, BarChart3, TrendingUp, Award, Calendar, ZoomIn, ZoomOut } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Cell, PieChart, Pie } from 'recharts';
import { useNotifications } from '../context/NotificationContext';
import ReactMarkdown from 'react-markdown';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as mammoth from 'mammoth';

function StudentDashboard() {
  const { notifications, markAllAsRead } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(() => localStorage.getItem('studentSelectedCourse') || null);
  const [courseContent, setCourseContent] = useState({ resources: [], quizzes: [] });
  const { resources, quizzes } = courseContent;
  const [searchTerm, setSearchTerm] = useState('');
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [quizScore, setQuizScore] = useState(null);
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('studentActiveTab') || 'analytics'); // 'analytics', 'courses', 'profile'
  const [profile, setProfile] = useState({ name: '', bio: '', avatar_url: '', email: '', stream: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user')));
  const [analyticsData, setAnalyticsData] = useState(null);
  const [viewingResource, setViewingResource] = useState(null);
  const [docHtml, setDocHtml] = useState(null);
  const [isLoadingDoc, setIsLoadingDoc] = useState(false);
  const [docZoom, setDocZoom] = useState(100);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const currentUser = JSON.parse(localStorage.getItem('user'));
    
    if (!token || currentUser?.role !== 'student') {
      navigate('/login');
      return;
    }
    
    if (currentUser.status !== 'approved') {
      toast.error("Your account is pending admin approval.");
      navigate('/');
      return;
    }
    
    fetchCourses(token);
    fetchProfile(token);
  }, [navigate]);

  useEffect(() => {
    localStorage.setItem('studentActiveTab', activeTab);
    const token = localStorage.getItem('token');
    if (token && activeTab === 'analytics') {
      fetchStudentAnalytics(token);
    }
  }, [activeTab]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (viewingResource && (
        (e.ctrlKey && e.key === 'p') || 
        (e.ctrlKey && e.key === 's') ||
        (e.metaKey && e.key === 'p') ||
        (e.metaKey && e.key === 's')
      )) {
        e.preventDefault();
        toast.error("Download and printing are disabled for this resource.");
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewingResource]);

  useEffect(() => {
    if (selectedCourse) {
      localStorage.setItem('studentSelectedCourse', selectedCourse);
      fetchCourseDetails(selectedCourse);
    } else {
      localStorage.removeItem('studentSelectedCourse');
    }
  }, [selectedCourse]);

  const fetchProfile = async (token) => {
    try {
      const res = await axios.get('/api/student/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProfile(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.put('/api/student/profile', profile, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (err) {
      toast.error('Failed to update profile');
    }
  };

  const fetchCourses = async (token) => {
    try {
      const res = await axios.get('/api/student/courses', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCourses(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCourseDetails = async (courseId) => {
    try {
      const token = localStorage.getItem('token');
      const resData = await axios.get(`/api/student/courses/${courseId}/resources`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const resQuiz = await axios.get(`/api/student/courses/${courseId}/quizzes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCourseContent({ resources: resData.data, quizzes: resQuiz.data });
      setActiveQuiz(null);
      setQuizScore(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCourseClick = (courseId) => {
    setSelectedCourse(courseId);
    setIsSidebarOpen(false);
  };

  const fetchStudentAnalytics = async (token) => {
    try {
      const res = await axios.get('/api/student/analytics', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnalyticsData(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartQuiz = async (quizId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`/api/student/quizzes/${quizId}/questions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQuestions(res.data);
      setActiveQuiz(quizId);
      setAnswers({});
      setQuizScore(null);
      setCurrentQuestionIndex(0);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load quiz');
    }
  };

  const handleAnswerSelect = (questionId, optionValue) => {
    setAnswers({ ...answers, [questionId]: optionValue });
  };
  
  const getFullUrl = (path) => {
    if (!path) return '';
    const rawPath = String(path).trim();
    const uploadsMatch = rawPath.match(/uploads[/\\](.+)$/);
    const cleanPath = uploadsMatch ? `uploads/${uploadsMatch[1]}` : rawPath;
    
    // Check if it's already an absolute URL (starts with http, https, //, or /http)
    if (/^\/?(https?:)?\/\//.test(cleanPath)) {
      // Remove leading slash if it exists before the URL
      return cleanPath.startsWith('/') ? cleanPath.substring(1) : cleanPath;
    }
    return `https://uni-resource-backend.onrender.com/${cleanPath}`;
  };

  const handleOpenResource = async (resource) => {
    const fileUrl = getFullUrl(resource.file_url);
    const extension = fileUrl.split('.').pop().toLowerCase();

    if (extension === 'pdf' || extension === 'docx' || resource.type === 'link') {
      setViewingResource(resource);
      if (extension === 'docx') {
        setIsLoadingDoc(true);
        try {
          // Use axios for conversion to avoid CORS iframe issues with mammoth
          // Explicitly clear headers to avoid 401 errors from Cloudinary
          const res = await axios.get(fileUrl, { 
            responseType: 'arraybuffer',
            headers: { Authorization: undefined } 
          });
          const result = await mammoth.convertToHtml({ arrayBuffer: res.data });
          setDocHtml(result.value);
          setIsLoadingDoc(false);
        } catch (err) {
          console.error('Docx handling failed', err);
          toast.error('Failed to view Word document');
          setDocHtml(null);
          setIsLoadingDoc(false);
        }
      }
    } else {
      window.open(fileUrl, '_blank');
    }
  };

  const handleSubmitQuiz = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`/api/student/quizzes/${activeQuiz}/submit`, { answers }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQuizScore(res.data.score);
      toast.success(`Quiz submitted! You scored ${res.data.score}%`);
    } catch (err) {
      console.error(err);
      toast.error('Failed to submit quiz');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('studentActiveTab');
    localStorage.removeItem('studentSelectedCourse');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-transparent flex flex-col md:flex-row animate-premium">
      {/* Mobile Header */}
      <div className="md:hidden glass sticky top-0 z-50 px-4 py-3 flex justify-between items-center">
        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-600 to-brand-900">
          Student Portal
        </span>
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

      {/* Sidebar */}
      <aside className={`${isSidebarOpen ? 'block' : 'hidden'} md:block w-full md:w-72 glass md:h-screen sticky top-0 z-40 flex flex-col`}>
        <div className="hidden md:block p-6">
          <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-600 to-brand-900">
            Student Portal
          </span>
        </div>
        
        <div className="px-6 py-2">
          <button 
            onClick={() => {setActiveTab('analytics'); setIsSidebarOpen(false); setSelectedCourse(null); setActiveQuiz(null); fetchStudentAnalytics(localStorage.getItem('token'));}}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-colors text-left mb-6 ${activeTab === 'analytics' ? 'bg-brand-100 text-brand-700 font-semibold' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <BarChart3 className="w-5 h-5 flex-shrink-0" />
            <span>Progress</span>
          </button>

          <button 
            onClick={() => {setActiveTab('courses'); setSelectedCourse(null); setIsSidebarOpen(false);}}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-colors text-left mb-2 ${activeTab === 'courses' ? 'bg-brand-100 text-brand-700 font-semibold' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            <Layers className="w-5 h-5 flex-shrink-0" />
            <span>Courses</span>
          </button>
        </div>
        
        <nav className="flex-1 px-4 overflow-y-auto space-y-1">
          <div className="pt-4 mt-4 border-t border-slate-200/50">
             <h3 className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-2 px-6">Account</h3>
             <button 
                onClick={() => {setActiveTab('profile'); setIsSidebarOpen(false); setSelectedCourse(null); setActiveQuiz(null);}}
                className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-colors text-left ${activeTab === 'profile' ? 'bg-brand-100 text-brand-700 font-semibold' : 'text-slate-600 hover:bg-slate-100'}`}
              >
                <User className="w-5 h-5 flex-shrink-0" />
                 <span>My Profile</span>
              </button>
          </div>
        </nav>

        <div className="p-4 mt-auto border-t border-slate-200/50 space-y-2">

          <button onClick={handleLogout} className="flex items-center gap-2 text-slate-600 hover:text-red-500 transition-colors w-full px-4 py-2">
            <LogOut className="w-5 h-5" /> Log Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-6 md:p-10 z-10 w-full overflow-x-hidden">
        {activeTab === 'analytics' && analyticsData && (
          <div className="animate-in fade-in duration-500 space-y-8">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-2">My Learning Progress</h2>
            <p className="text-slate-500">Track your performance across all assessments and identify areas for improvement.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="glass p-6 rounded-2xl border border-brand-100 flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-sm font-medium">Total Quizzes</p>
                  <h4 className="text-3xl font-bold text-slate-900 mt-1">{analyticsData.stats.totalQuizzes}</h4>
                </div>
                <div className="bg-brand-100 p-3 rounded-xl text-brand-600">
                  <Award className="w-6 h-6" />
                </div>
              </div>
              <div className="glass p-6 rounded-2xl border border-brand-100 flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-sm font-medium">Average Score</p>
                  <h4 className="text-3xl font-bold text-slate-900 mt-1">{analyticsData.stats.averageScore}%</h4>
                </div>
                <div className="bg-green-100 p-3 rounded-xl text-green-600">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
               <div className="glass p-6 rounded-2xl min-h-[400px]">
                  <h3 className="text-xl font-bold text-slate-800 mb-6">Performance Trend</h3>
                  <div className="h-[300px] w-full">
                    {analyticsData.recentScores.length > 0 ? (
                       <ResponsiveContainer width="100%" height="100%">
                         <BarChart data={[...analyticsData.recentScores].reverse()}>
                           <CartesianGrid strokeDasharray="3 3" vertical={false} />
                           <XAxis dataKey="title" hide={analyticsData.recentScores.length > 5} />
                           <YAxis domain={[0, 100]} />
                           <Tooltip />
                           <Bar dataKey="score" fill="#6366f1" radius={[4, 4, 0, 0]}>
                              {analyticsData.recentScores.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.score >= 80 ? '#10b981' : entry.score >= 50 ? '#6366f1' : '#f43f5e'} />
                              ))}
                           </Bar>
                         </BarChart>
                       </ResponsiveContainer>
                    ) : (
                       <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4">
                          <Calendar className="w-12 h-12 opacity-20" />
                          <p>No quiz data available yet. Start a course to see your progress!</p>
                       </div>
                    )}
                  </div>
               </div>

               <div className="glass p-6 rounded-2xl">
                  <h3 className="text-xl font-bold text-slate-800 mb-6">Recent Quiz History</h3>
                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                    {analyticsData.recentScores.length === 0 ? (
                       <p className="text-slate-500 text-center py-8">Your recent scores will appear here.</p>
                    ) : (
                       analyticsData.recentScores.map((score, i) => (
                         <div key={i} className="flex items-center justify-between p-4 bg-white/50 rounded-xl border border-slate-100">
                            <div>
                               <p className="font-bold text-slate-800">{score.title}</p>
                               <p className="text-xs text-slate-400">{new Date(score.completed_at).toLocaleDateString()}</p>
                            </div>
                            <div className={`text-lg font-bold ${score.score >= 80 ? 'text-green-600' : score.score >= 50 ? 'text-brand-600' : 'text-red-600'}`}>
                               {score.score}%
                            </div>
                         </div>
                       ))
                    )}
                  </div>
               </div>
            </div>
          </div>
        )}

        {activeTab === 'profile' ? (
          <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom duration-500">
            <h2 className="text-3xl font-extrabold text-slate-900 mb-8">Personal Profile</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="md:col-span-1">
                <div className="glass p-8 rounded-3xl text-center border border-brand-100">
                  <div className="relative inline-block mb-4">
                    <div className="w-32 h-32 rounded-full border-4 border-white shadow-xl overflow-hidden bg-brand-50 flex items-center justify-center">
                       {profile.avatar_url ? (
                          <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                       ) : (
                          <User className="w-16 h-16 text-brand-300" />
                       )}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">{profile.name}</h3>
                  <p className="text-slate-500 text-sm mb-4">{profile.email}</p>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${profile.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {profile.status}
                  </span>
                </div>
              </div>

              <div className="md:col-span-2">
                <div className="glass p-8 rounded-3xl border border-brand-100 h-full">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-slate-800">Account Details</h3>
                    <button 
                      onClick={() => setIsEditing(!isEditing)}
                      className="text-brand-600 hover:text-brand-700 flex items-center gap-2 text-sm font-semibold"
                    >
                      {isEditing ? 'Cancel Editing' : <><Edit2 className="w-4 h-4" /> Edit Profile</>}
                    </button>
                  </div>

                  <form onSubmit={handleUpdateProfile} className="space-y-6">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Display Name</label>
                      <input 
                        type="text" 
                        disabled={!isEditing}
                        value={profile.name}
                        onChange={(e) => setProfile({...profile, name: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none bg-white/50 focus:border-brand-500 disabled:opacity-60 transition-all font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Biography</label>
                      <textarea 
                        rows="4"
                        disabled={!isEditing}
                        value={profile.bio || ''}
                        onChange={(e) => setProfile({...profile, bio: e.target.value})}
                        placeholder="Tell us a bit about yourself..."
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none bg-white/50 focus:border-brand-500 disabled:opacity-60 transition-all font-medium resize-none"
                      ></textarea>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Avatar URL (Optional)</label>
                      <input 
                        type="text" 
                        disabled={!isEditing}
                        value={profile.avatar_url || ''}
                        placeholder="https://example.com/photo.jpg"
                        onChange={(e) => setProfile({...profile, avatar_url: e.target.value})}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none bg-white/50 focus:border-brand-500 disabled:opacity-60 transition-all font-medium"
                      />
                    </div>
                    {isEditing && (
                      <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2">
                        <Save className="w-5 h-5" /> Save Changes
                      </button>
                    )}
                  </form>
                </div>
              </div>
            </div>
          </div>
        ) : activeQuiz ? (
          <div className="max-w-3xl mx-auto">
            <button onClick={() => setActiveQuiz(null)} className="mb-6 text-brand-600 hover:underline flex items-center gap-2">
              ← Back to Course content
            </button>
            <div className="glass p-8 rounded-3xl">
              {quizScore !== null ? (
                <div className="text-center py-10">
                  <h2 className="text-4xl font-extrabold text-slate-900 mb-4">Quiz Completed!</h2>
                  <div className="inline-flex items-center justify-center w-32 h-32 rounded-full border-8 border-brand-500 text-3xl font-bold text-brand-600 mb-6">
                    {quizScore}%
                  </div>
                  <p className="text-slate-500 mb-8">Your score has been successfully recorded.</p>
                  <button onClick={() => setActiveQuiz(null)} className="bg-brand-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-brand-700 transition-colors">
                    Back to Course
                  </button>
                </div>
              ) : (
                <div className="space-y-8">
                  <h2 className="text-3xl font-extrabold text-slate-900 mb-6">Taking Quiz</h2>
                  {questions.length === 0 ? (
                    <p className="text-slate-500">No questions found for this quiz.</p>
                  ) : (
                    <div>
                      <div className="mb-4 flex justify-between items-center text-slate-500 font-medium">
                        <span>Question {currentQuestionIndex + 1} of {questions.length}</span>
                        <span className="bg-brand-100 text-brand-700 px-3 py-1 rounded-full text-xs font-bold">
                          {Math.round((currentQuestionIndex / questions.length) * 100)}% Completed
                        </span>
                      </div>
                      
                      {(() => {
                        const q = questions[currentQuestionIndex];
                        return (
                          <div key={q.id} className="bg-white/50 p-6 rounded-2xl border border-slate-200 mb-8">
                            <p className="font-bold text-lg text-slate-800 mb-4">{currentQuestionIndex + 1}. {q.question_text}</p>
                            <div className="space-y-3">
                              {q.options.map((opt, i) => (
                                <label key={i} className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-colors ${answers[q.id] === opt ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                                  <input 
                                    type="radio" 
                                    name={`question_${q.id}`} 
                                    value={opt}
                                    checked={answers[q.id] === opt}
                                    onChange={() => handleAnswerSelect(q.id, opt)}
                                    className="w-5 h-5 text-brand-600"
                                  />
                                  <span className="text-slate-700">{opt}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        );
                      })()}

                      <div className="flex gap-4">
                        <button
                          onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                          disabled={currentQuestionIndex === 0}
                          className="flex-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 font-bold py-4 rounded-xl transition-all"
                        >
                          Previous
                        </button>
                        
                        {currentQuestionIndex < questions.length - 1 ? (
                          <button
                            onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
                            className="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-bold py-4 rounded-xl transition-all"
                          >
                            Next
                          </button>
                        ) : (
                          <button 
                            onClick={handleSubmitQuiz}
                            disabled={Object.keys(answers).length !== questions.length}
                            className="flex-1 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-bold py-4 rounded-xl transition-all"
                          >
                            Submit Quiz
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : activeTab === 'courses' && selectedCourse ? (
          <div>
            <div className="mb-8 flex items-center justify-between">
               <div>
                  <h2 className="text-3xl font-extrabold text-slate-900 mb-2">
                    {courses.find(c => c.id === selectedCourse)?.title || 'Course Content'}
                  </h2>
                  <p className="text-slate-500">Access reading materials, videos, and assessments.</p>
               </div>
               <button 
                 onClick={() => setSelectedCourse(null)}
                 className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2"
               >
                 ← Back to All Courses
               </button>
            </div>

            {courses.find(c => c.id === selectedCourse)?.rich_content && (
              <div className="glass p-8 rounded-3xl mb-12 border border-brand-100 prose prose-slate max-w-none">
                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-brand-500" /> Lesson Module
                </h3>
                <div className="text-slate-700 leading-relaxed">
                  <ReactMarkdown>{courses.find(c => c.id === selectedCourse).rich_content}</ReactMarkdown>
                </div>
              </div>
            )}
            
            <h3 className="text-xl font-bold text-slate-800 mb-4 mt-8 flex items-center gap-2"><BookOpen className="w-5 h-5 text-brand-500" /> Learning Resources</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {resources.length === 0 ? (
                <div className="col-span-full glass p-8 rounded-2xl text-center text-slate-500">
                  No resources available yet.
                </div>
              ) : (
                resources.map(resource => (
                  <div key={resource.id} className="glass p-6 rounded-2xl flex flex-col hover:-translate-y-1 transition-transform border border-slate-200/50">
                    <div className="flex-1">
                      <div className="w-10 h-10 bg-brand-100 text-brand-600 rounded-lg flex items-center justify-center mb-4">
                        <Download className="w-5 h-5" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-800 mb-1">{resource.title}</h3>
                      <p className="text-sm text-slate-600 mb-4">{resource.description}</p>
                    </div>
                    <button 
                      onClick={() => handleOpenResource(resource)}
                      className="block text-center w-full bg-slate-900 hover:bg-slate-800 text-white font-medium py-2.5 rounded-xl transition-colors"
                    >
                      Open Resource
                    </button>
                  </div>
                ))
              )}
            </div>

            <h3 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2"><Layers className="w-5 h-5 text-brand-500" /> Course Assessments</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {quizzes?.length === 0 ? (
                <div className="col-span-full glass p-8 rounded-2xl text-center text-slate-500">
                  No quizzes assigned to this course.
                </div>
              ) : (
                quizzes.map(quiz => (
                  <div key={quiz.id} className="glass p-6 rounded-2xl border border-brand-100 flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-slate-800 text-lg">{quiz.title}</h4>
                      <p className="text-slate-500 text-sm">{quiz.description}</p>
                    </div>
                    <button onClick={() => handleStartQuiz(quiz.id)} className="bg-brand-100 text-brand-700 hover:bg-brand-200 px-6 py-2.5 rounded-xl font-semibold transition-colors">
                      Start Quiz
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : activeTab === 'courses' ? (
          <div>
            <div className="mb-8">
               <h2 className="text-3xl font-extrabold text-slate-900 mb-2">My Courses</h2>
               <p className="text-slate-500">Select a course below to view learning materials and quizzes.</p>
            </div>
            
            <div className="mb-6 relative max-w-md">
              <input 
                type="text"
                placeholder="Filter courses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white/50 outline-none focus:ring-2 focus:ring-brand-500 transition-all"
              />
              <BookOpen className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.filter(c => c.title.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 ? (
                <div className="col-span-full glass p-12 text-center text-slate-500 rounded-3xl">
                   No courses found matching your search.
                </div>
              ) : (
                courses.filter(c => c.title.toLowerCase().includes(searchTerm.toLowerCase())).map(course => (
                  <div key={course.id} className="glass p-6 rounded-3xl border border-slate-200/50 hover:border-brand-300 transition-all hover:shadow-xl group">
                    <div className="w-12 h-12 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-brand-600 group-hover:text-white transition-colors">
                      <BookOpen className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">{course.title}</h3>
                    <p className="text-sm text-slate-500 mb-6 line-clamp-2">{course.description}</p>
                    <button 
                      onClick={() => handleCourseClick(course.id)}
                      className="w-full py-3 bg-slate-900 text-white rounded-xl font-semibold hover:bg-brand-600 transition-colors"
                    >
                      View content
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 min-h-[50vh]">
            <Layers className="w-16 h-16 mb-4 opacity-50" />
            <h2 className="text-xl font-medium">Select a feature to get started</h2>
          </div>
        )}
      </main>

      {/* Resource Viewer Modal */}
      {viewingResource && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 no-select"
          onContextMenu={(e) => e.preventDefault()}
        >
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => {setViewingResource(null); setDocHtml(null);}} />
          <div className="glass bg-white w-full max-w-5xl h-[90vh] flex flex-col rounded-3xl shadow-2xl relative animate-zoom-in overflow-hidden">
             <div className="p-4 border-b flex justify-between items-center bg-slate-50">
               <div className="flex items-center gap-4">
                  <div>
                    <h3 className="font-bold text-slate-900 line-clamp-1">{viewingResource.title}</h3>
                    <p className="text-xs text-slate-500">{viewingResource.description}</p>
                  </div>
                  {docHtml && (
                    <div className="hidden sm:flex items-center bg-white border border-slate-200 rounded-xl px-2 py-1 gap-1 ml-4 shadow-sm">
                      <button 
                        onClick={() => setDocZoom(prev => Math.max(prev - 20, 40))}
                        className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Zoom Out"
                      >
                        <ZoomOut className="w-4 h-4 text-slate-600" />
                      </button>
                      <span className="text-[11px] font-bold text-slate-700 w-12 text-center">{docZoom}%</span>
                      <button 
                        onClick={() => setDocZoom(prev => Math.min(prev + 20, 200))}
                        className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Zoom In"
                      >
                        <ZoomIn className="w-4 h-4 text-slate-600" />
                      </button>
                    </div>
                  )}
               </div>
               <button onClick={() => {setViewingResource(null); setDocHtml(null); setDocZoom(100);}} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                  <X className="w-6 h-6" />
               </button>
             </div>
             <div className="flex-1 overflow-auto p-4 bg-slate-100 flex justify-center">
                {isLoadingDoc ? (
                   <div className="flex items-center justify-center h-full w-full">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600"></div>
                   </div>
                ) : docHtml ? (
                   <iframe 
                      srcDoc={`
                        <html>
                          <head>
                            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
                            <style>
                              body { 
                                font-family: 'Inter', sans-serif; 
                                padding: 60px 40px; 
                                margin: 0 auto;
                                max-width: 800px;
                                background-color: white; 
                                color: #334155;
                                line-height: 1.6;
                                user-select: none;
                                -webkit-user-select: none;
                                zoom: ${docZoom}%;
                              }
                              h1, h2, h3 { color: #0f172a; margin-top: 1.5em; }
                              p { margin-bottom: 1em; }
                              img { max-width: 100%; height: auto; border-radius: 8px; }
                            </style>
                          </head>
                          <body oncontextmenu="return false;">
                            ${docHtml}
                          </body>
                        </html>
                      `}
                      className="w-full h-full bg-white rounded-xl shadow-inner border-0"
                      title={viewingResource.title}
                   />
                ) : viewingResource.type === 'link' ? (
                    <iframe 
                      src={getFullUrl(viewingResource.file_url)} 
                      className="w-full h-full bg-white rounded-xl shadow-inner border-0"
                      title={viewingResource.title}
                    />
                ) : viewingResource.file_url.split('.').pop().toLowerCase() === 'pdf' ? (
                   <iframe 
                      src={`${getFullUrl(viewingResource.file_url)}#toolbar=0&navpanes=0&scrollbar=0`} 
                      className="w-full h-full bg-white rounded-xl shadow-inner border-0"
                      title={viewingResource.title}
                   />
                ) : (
                   <div className="flex flex-col items-center justify-center h-full text-slate-500">
                      <BookOpen className="w-16 h-16 mb-4 opacity-20" />
                      <p>Full view not available for this file type.</p>
                      <p className="text-xs mt-2 text-slate-400 italic">Downloads are disabled for academic integrity.</p>
                   </div>
                )}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
