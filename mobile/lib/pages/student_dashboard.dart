import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:url_launcher/url_launcher.dart';
import '../core/theme.dart';

class StudentDashboard extends StatefulWidget {
  const StudentDashboard({super.key});

  @override
  State<StudentDashboard> createState() => _StudentDashboardState();
}

class _StudentDashboardState extends State<StudentDashboard> {
  String _activeTab = 'analytics'; // 'analytics', 'courses', 'profile'
  Map<String, dynamic>? _user;
  String? _token;

  // Data states
  Map<String, dynamic>? _profile;
  List<dynamic> _courses = [];
  Map<String, dynamic>? _analyticsData;

  // Course Details State
  String? _selectedCourseId;
  List<dynamic> _courseResources = [];
  List<dynamic> _courseQuizzes = [];
  
  // Quiz Taking State
  String? _activeQuizId;
  int _currentQuestionIndex = 0;
  List<dynamic> _questions = [];
  Map<String, dynamic> _answers = {};
  int? _quizScore;

  bool _isLoading = true;
  bool _isLoadingSubView = false;

  @override
  void initState() {
    super.initState();
    _loadUserAndData();
  }

  Future<void> _loadUserAndData() async {
    final prefs = await SharedPreferences.getInstance();
    final token = prefs.getString('token');
    final userStr = prefs.getString('user');

    if (token == null || userStr == null) {
      if (mounted) Navigator.pushReplacementNamed(context, '/login');
      return;
    }

    setState(() {
      _token = token;
      _user = json.decode(userStr);
    });

    await Future.wait([
      _fetchProfile(),
      _fetchCourses(),
      _fetchAnalytics(),
    ]);

    setState(() => _isLoading = false);
  }

  Future<void> _fetchProfile() async {
    try {
      final res = await http.get(
        Uri.parse('https://uni-resource-backend.onrender.com/api/student/profile'),
        headers: {'Authorization': 'Bearer $_token'},
      );
      if (res.statusCode == 200) {
        setState(() => _profile = json.decode(res.body));
      }
    } catch (e) {
      // Ignore network errors for placeholder
    }
  }

  Future<void> _fetchCourses() async {
    try {
      final res = await http.get(
        Uri.parse('https://uni-resource-backend.onrender.com/api/student/courses'),
        headers: {'Authorization': 'Bearer $_token'},
      );
      if (res.statusCode == 200) {
        setState(() => _courses = json.decode(res.body));
      }
    } catch (e) {
      // Ignore
    }
  }

  Future<void> _fetchAnalytics() async {
    try {
      final res = await http.get(
        Uri.parse('https://uni-resource-backend.onrender.com/api/student/analytics'),
        headers: {'Authorization': 'Bearer $_token'},
      );
      if (res.statusCode == 200) {
        setState(() => _analyticsData = json.decode(res.body));
      }
    } catch (e) {
      // Ignore
    }
  }

  Future<void> _fetchCourseDetails(String courseId) async {
    setState(() {
      _selectedCourseId = courseId;
      _isLoadingSubView = true;
      _activeQuizId = null;
      _quizScore = null;
    });

    try {
      final resResources = await http.get(
        Uri.parse('https://uni-resource-backend.onrender.com/api/student/courses/$courseId/resources'),
        headers: {'Authorization': 'Bearer $_token'},
      );
      final resQuizzes = await http.get(
        Uri.parse('https://uni-resource-backend.onrender.com/api/student/courses/$courseId/quizzes'),
        headers: {'Authorization': 'Bearer $_token'},
      );
      
      setState(() {
        if (resResources.statusCode == 200) _courseResources = json.decode(resResources.body);
        if (resQuizzes.statusCode == 200) _courseQuizzes = json.decode(resQuizzes.body);
        _isLoadingSubView = false;
      });
    } catch (err) {
      setState(() => _isLoadingSubView = false);
    }
  }

  Future<void> _handleStartQuiz(String quizId) async {
    setState(() {
      _isLoadingSubView = true;
    });

    try {
      final res = await http.get(
        Uri.parse('https://uni-resource-backend.onrender.com/api/student/quizzes/$quizId/questions'),
        headers: {'Authorization': 'Bearer $_token'},
      );
      if (res.statusCode == 200) {
        setState(() {
          _questions = json.decode(res.body);
          _activeQuizId = quizId;
          _answers = {};
          _quizScore = null;
          _isLoadingSubView = false;
          _currentQuestionIndex = 0;
        });
      } else {
        setState(() => _isLoadingSubView = false);
      }
    } catch (err) {
      setState(() => _isLoadingSubView = false);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to load quiz'), backgroundColor: AppTheme.social600));
    }
  }

  Future<void> _handleSubmitQuiz() async {
    setState(() => _isLoadingSubView = true);
    try {
      final res = await http.post(
        Uri.parse('https://uni-resource-backend.onrender.com/api/student/quizzes/$_activeQuizId/submit'),
        headers: {'Authorization': 'Bearer $_token', 'Content-Type': 'application/json'},
        body: json.encode({'answers': _answers}),
      );
      
      if (res.statusCode == 200 || res.statusCode == 201) {
        final data = json.decode(res.body);
        setState(() {
          _quizScore = data['score'];
          _isLoadingSubView = false;
        });
        _fetchAnalytics(); // Refresh analytics state in the background
      } else {
        setState(() => _isLoadingSubView = false);
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to submit quiz'), backgroundColor: AppTheme.social600));
      }
    } catch (err) {
      setState(() => _isLoadingSubView = false);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Network error'), backgroundColor: AppTheme.social600));
    }
  }

  String _getFullUrl(String? path) {
    if (path == null || path.isEmpty) return '';
    path = path.trim();
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    
    var match = RegExp(r'uploads[/\\](.+)$').firstMatch(path);
    var cleanPath = match != null ? 'uploads/${match.group(1)}' : path;
    
    return 'https://uni-resource-backend.onrender.com/$cleanPath';
  }

  Future<void> _openResource(Map<String, dynamic> resource) async {
    final urlString = _getFullUrl(resource['file_url']);
    if (urlString.isEmpty) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Invalid resource URL', style: TextStyle(color: Colors.white)), backgroundColor: AppTheme.social600));
      return;
    }

    if (kIsWeb) {
      if (!await launchUrl(Uri.parse(urlString), mode: LaunchMode.inAppBrowserView)) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Could not launch URL'), backgroundColor: AppTheme.social600));
      }
      return;
    }

    final controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(Colors.white)
      ..loadRequest(Uri.parse(urlString));

    showDialog(
      context: context,
      barrierDismissible: true, // Allow user to tap outside to close
      builder: (BuildContext context) {
        return Dialog(
          insetPadding: const EdgeInsets.all(16),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
          clipBehavior: Clip.antiAlias,
          child: Column(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                color: Colors.white,
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(resource['title'] ?? 'Resource Viewer', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Color(0xFF1E293B)), maxLines: 1, overflow: TextOverflow.ellipsis),
                          if (resource['description'] != null) Text(resource['description'], style: const TextStyle(fontSize: 12, color: Color(0xFF64748B)), maxLines: 1, overflow: TextOverflow.ellipsis),
                        ],
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close, color: Color(0xFF64748B)),
                      onPressed: () => Navigator.of(context).pop(),
                    )
                  ],
                ),
              ),
              const Divider(height: 1, color: Color(0xFFE2E8F0)),
              Expanded(
                child: WebViewWidget(controller: controller),
              )
            ],
          ),
        );
      },
    );
  }

  void _handleLogout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
    if (mounted) Navigator.pushReplacementNamed(context, '/login');
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator(color: AppTheme.brand600)),
      );
    }

    return Scaffold(
      backgroundColor: AppTheme.bgMain, // bg-slate-50 equivalent loosely
      appBar: AppBar(
        title: ShaderMask(
          shaderCallback: (bounds) => const LinearGradient(
            colors: [AppTheme.brand600, AppTheme.brand900],
          ).createShader(bounds),
          child: const Text('Student Portal', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
        ),
        backgroundColor: Colors.white.withOpacity(0.9),
        elevation: 0,
        iconTheme: const IconThemeData(color: Color(0xFF475569)),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_none),
            onPressed: () {},
          )
        ],
      ),
      drawer: Drawer(
        backgroundColor: Colors.white,
        child: Column(
          children: [
            const UserAccountsDrawerHeader(
              decoration: BoxDecoration(color: AppTheme.brand50),
              accountName: Text('Student Portal', style: TextStyle(color: AppTheme.brand900, fontWeight: FontWeight.bold, fontSize: 20)),
              accountEmail: null,
            ),
            ListTile(
              leading: Icon(Icons.bar_chart, color: _activeTab == 'analytics' ? AppTheme.brand700 : const Color(0xFF475569)),
              title: Text('Progress', style: TextStyle(color: _activeTab == 'analytics' ? AppTheme.brand700 : const Color(0xFF475569), fontWeight: _activeTab == 'analytics' ? FontWeight.bold : FontWeight.normal)),
              tileColor: _activeTab == 'analytics' ? AppTheme.brand100 : Colors.transparent,
              onTap: () {
                setState(() { _activeTab = 'analytics'; _selectedCourseId = null; _activeQuizId = null; });
                _fetchAnalytics();
                Navigator.pop(context);
              },
            ),
            ListTile(
              leading: Icon(Icons.layers, color: _activeTab == 'courses' ? AppTheme.brand700 : const Color(0xFF475569)),
              title: Text('Courses', style: TextStyle(color: _activeTab == 'courses' ? AppTheme.brand700 : const Color(0xFF475569), fontWeight: _activeTab == 'courses' ? FontWeight.bold : FontWeight.normal)),
              tileColor: _activeTab == 'courses' ? AppTheme.brand100 : Colors.transparent,
              onTap: () {
                setState(() { _activeTab = 'courses'; _selectedCourseId = null; _activeQuizId = null; });
                Navigator.pop(context);
              },
            ),
            const Divider(),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Text('ACCOUNT', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey.shade500)),
            ),
            ListTile(
              leading: Icon(Icons.person, color: _activeTab == 'profile' ? AppTheme.brand700 : const Color(0xFF475569)),
              title: Text('My Profile', style: TextStyle(color: _activeTab == 'profile' ? AppTheme.brand700 : const Color(0xFF475569), fontWeight: _activeTab == 'profile' ? FontWeight.bold : FontWeight.normal)),
              tileColor: _activeTab == 'profile' ? AppTheme.brand100 : Colors.transparent,
              onTap: () {
                setState(() { _activeTab = 'profile'; _selectedCourseId = null; _activeQuizId = null; });
                Navigator.pop(context);
              },
            ),
            const Spacer(),
            const Divider(),
            ListTile(
              leading: const Icon(Icons.logout, color: AppTheme.social500),
              title: const Text('Log Out', style: TextStyle(color: AppTheme.social500)),
              onTap: _handleLogout,
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_activeTab == 'analytics') return _buildAnalyticsTab();
    if (_activeTab == 'profile') return _buildProfileTab();

    // Courses UI Matrix
    if (_activeTab == 'courses') {
      if (_activeQuizId != null) {
        return _buildQuizTakingTab();
      } else if (_selectedCourseId != null) {
        return _buildCourseDetailsTab();
      } else {
        return _buildCoursesTab();
      }
    }
    
    return const Center(child: Text('Select a feature'));
  }

  Widget _buildQuizTakingTab() {
    if (_isLoadingSubView) return const Center(child: CircularProgressIndicator(color: AppTheme.brand600));

    if (_quizScore != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Container(
            padding: const EdgeInsets.all(40),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: AppTheme.borderColor),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Text('Quiz Completed!', style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold, color: Color(0xFF0F172A))),
                const SizedBox(height: 24),
                Container(
                  width: 120, height: 120,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(color: AppTheme.brand500, width: 8),
                  ),
                  child: Text('$_quizScore%', style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: AppTheme.brand600)),
                ),
                const SizedBox(height: 24),
                const Text('Your score has been successfully recorded.', style: TextStyle(color: Color(0xFF64748B)), textAlign: TextAlign.center),
                const SizedBox(height: 32),
                ElevatedButton(
                  onPressed: () => setState(() => _activeQuizId = null),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.brand600,
                    padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))
                  ),
                  child: const Text('Back to Course', style: TextStyle(fontSize: 16, color: Colors.white)),
                )
              ],
            ),
          ),
        ),
      );
    }

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Row(
          children: [
            TextButton.icon(
              icon: const Icon(Icons.arrow_back, color: AppTheme.brand600),
              label: const Text('Back to Course content', style: TextStyle(color: AppTheme.brand600)),
              onPressed: () => setState(() => _activeQuizId = null),
            )
          ],
        ),
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(color: Colors.white.withOpacity(0.9), borderRadius: BorderRadius.circular(24)),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Taking Quiz', style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Color(0xFF0F172A))),
              const SizedBox(height: 24),
              if (_questions.isEmpty)
                const Text('No questions found for this quiz.', style: TextStyle(color: Colors.grey))
              else
                Builder(builder: (context) {
                  var q = _questions[_currentQuestionIndex];
                  String qId = q['id'].toString();
                  List<dynamic> options = q['options'];

                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(child: Text('Question ${_currentQuestionIndex + 1} of ${_questions.length}', style: const TextStyle(color: Color(0xFF64748B), fontWeight: FontWeight.bold))),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                            decoration: BoxDecoration(color: AppTheme.brand100, borderRadius: BorderRadius.circular(16)),
                            child: Text('${((_currentQuestionIndex / _questions.length) * 100).round()}% Completed', style: const TextStyle(color: AppTheme.brand700, fontSize: 12, fontWeight: FontWeight.bold)),
                          )
                        ],
                      ),
                      const SizedBox(height: 16),
                      Container(
                        margin: const EdgeInsets.only(bottom: 24),
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.5),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: Colors.grey.shade200),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('${_currentQuestionIndex + 1}. ${q['question_text']}', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF1E293B))),
                            const SizedBox(height: 16),
                            ...options.map((opt) {
                              bool isSelected = _answers[qId] == opt;
                              return InkWell(
                                onTap: () => setState(() => _answers[qId] = opt),
                                child: Container(
                                  margin: const EdgeInsets.only(bottom: 8),
                                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                                  decoration: BoxDecoration(
                                    color: isSelected ? AppTheme.brand50 : Colors.white,
                                    border: Border.all(color: isSelected ? AppTheme.brand500 : Colors.grey.shade300),
                                    borderRadius: BorderRadius.circular(12),
                                  ),
                                  child: Row(
                                    children: [
                                      Icon(isSelected ? Icons.radio_button_checked : Icons.radio_button_unchecked, color: isSelected ? AppTheme.brand600 : Colors.grey),
                                      const SizedBox(width: 12),
                                      Expanded(child: Text(opt.toString(), style: const TextStyle(color: Color(0xFF334155)))),
                                    ],
                                  ),
                                ),
                              );
                            }).toList(),
                          ],
                        ),
                      ),
                      Row(
                        children: [
                          Expanded(
                            child: ElevatedButton(
                              onPressed: _currentQuestionIndex > 0 ? () => setState(() => _currentQuestionIndex--) : null,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.grey.shade200,
                                foregroundColor: Colors.grey.shade800,
                                padding: const EdgeInsets.symmetric(vertical: 16),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                elevation: 0
                              ),
                              child: const Text('Previous', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: _currentQuestionIndex < _questions.length - 1
                              ? ElevatedButton(
                                  onPressed: () => setState(() => _currentQuestionIndex++),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: AppTheme.brand600,
                                    foregroundColor: Colors.white,
                                    padding: const EdgeInsets.symmetric(vertical: 16),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                  ),
                                  child: const Text('Next', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                                )
                              : ElevatedButton(
                                  onPressed: (_answers.length == _questions.length) ? _handleSubmitQuiz : null,
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: const Color(0xFF0F172A),
                                    foregroundColor: Colors.white,
                                    padding: const EdgeInsets.symmetric(vertical: 16),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                    disabledBackgroundColor: Colors.grey.shade300,
                                  ),
                                  child: const Text('Submit Quiz', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                                ),
                          )
                        ],
                      )
                    ],
                  );
                }),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildCourseDetailsTab() {
    var course = _courses.firstWhere((c) => c['id'] == _selectedCourseId, orElse: () => null);

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(course?['title'] ?? 'Course Content', style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Color(0xFF0F172A))),
                  const SizedBox(height: 4),
                  const Text('Access reading materials, videos, and assessments.', style: TextStyle(color: Color(0xFF64748B))),
                ],
              ),
            ),
            IconButton(
              icon: const Icon(Icons.arrow_back),
              tooltip: 'Back to All Courses',
              onPressed: () => setState(() => _selectedCourseId = null),
            )
          ],
        ),
        const SizedBox(height: 24),

        if (_isLoadingSubView)
          const Center(child: Padding(padding: EdgeInsets.all(40), child: CircularProgressIndicator(color: AppTheme.brand600)))
        else ...[
          // Resources
          const Row(
            children: [
              Icon(Icons.menu_book, color: AppTheme.brand500, size: 20),
              SizedBox(width: 8),
              Expanded(child: Text('Learning Resources', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Color(0xFF1E293B)))),
            ],
          ),
          const SizedBox(height: 16),
          if (_courseResources.isEmpty)
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(color: Colors.white.withOpacity(0.8), borderRadius: BorderRadius.circular(16)),
              child: const Center(child: Text('No resources available yet.', style: TextStyle(color: Colors.grey))),
            )
          else ..._courseResources.map((resource) => 
            Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(color: Colors.white.withOpacity(0.9), borderRadius: BorderRadius.circular(16), border: Border.all(color: Colors.grey.shade200)),
              child: Row(
                children: [
                  Container(
                    width: 48, height: 48,
                    decoration: BoxDecoration(color: AppTheme.brand50, borderRadius: BorderRadius.circular(12)),
                    child: const Icon(Icons.download, color: AppTheme.brand600),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(resource['title'] ?? '', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF1E293B))),
                        Text(resource['description'] ?? '', style: const TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.open_in_new, color: AppTheme.brand600),
                    onPressed: () => _openResource(resource),
                  )
                ],
              ),
            ),
          ).toList(),

          const SizedBox(height: 32),

          // Quizzes
          const Row(
            children: [
              Icon(Icons.layers, color: AppTheme.brand500, size: 20),
              SizedBox(width: 8),
              Expanded(child: Text('Course Assessments', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Color(0xFF1E293B)))),
            ],
          ),
          const SizedBox(height: 16),
          if (_courseQuizzes.isEmpty)
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(color: Colors.white.withOpacity(0.8), borderRadius: BorderRadius.circular(16)),
              child: const Center(child: Text('No quizzes assigned to this course.', style: TextStyle(color: Colors.grey))),
            )
          else ..._courseQuizzes.map((quiz) => 
            Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(color: Colors.white.withOpacity(0.9), borderRadius: BorderRadius.circular(16), border: Border.all(color: AppTheme.brand100)),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(quiz['title'] ?? '', style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: Color(0xFF1E293B))),
                        Text(quiz['description'] ?? '', style: const TextStyle(fontSize: 12, color: Color(0xFF64748B))),
                      ],
                    ),
                  ),
                  ElevatedButton(
                    onPressed: () => _handleStartQuiz(quiz['id'].toString()),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppTheme.brand100,
                      foregroundColor: AppTheme.brand700,
                      elevation: 0,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    child: const Text('Start Quiz', style: TextStyle(fontWeight: FontWeight.bold)),
                  )
                ],
              ),
            ),
          ).toList(),
        ],
      ],
    );
  }

  Widget _buildAnalyticsTab() {
    if (_analyticsData == null) {
      return const Center(child: Text('Loading analytics...'));
    }

    final stats = _analyticsData!['stats'] ?? {};
    final recentScores = _analyticsData!['recentScores'] as List<dynamic>? ?? [];

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const Text('My Learning Progress', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Color(0xFF0F172A))),
        const SizedBox(height: 4),
        const Text('Track your performance across all assessments', style: TextStyle(color: Color(0xFF64748B))),
        const SizedBox(height: 24),
        Row(
          children: [
            Expanded(
              child: _buildStatCard(
                title: 'Total Quizzes',
                value: '${stats['totalQuizzes'] ?? 0}',
                icon: Icons.emoji_events,
                iconColor: AppTheme.brand600,
                iconBg: AppTheme.brand100,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: _buildStatCard(
                title: 'Average Score',
                value: '${stats['averageScore'] ?? 0}%',
                icon: Icons.trending_up,
                iconColor: Colors.green.shade600,
                iconBg: Colors.green.shade100,
              ),
            ),
          ],
        ),
        const SizedBox(height: 24),
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.8),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: AppTheme.borderColor),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text('Recent Quiz History', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF1E293B))),
              const SizedBox(height: 16),
              if (recentScores.isEmpty)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 24),
                  child: Center(child: Text('Your recent scores will appear here.', style: TextStyle(color: Colors.grey))),
                )
              else
                ...recentScores.map((scoreObj) {
                  return Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.grey.shade200),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(scoreObj['title'] ?? 'Quiz', style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF1E293B))),
                              Text('Completed recently', style: TextStyle(fontSize: 12, color: Colors.grey.shade500)),
                            ],
                          ),
                        ),
                        Text(
                          '${scoreObj['score']}%',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: ((scoreObj['score'] ?? 0) >= 80) ? Colors.green.shade600 : AppTheme.brand600,
                          ),
                        )
                      ],
                    ),
                  );
                }).toList(),
            ],
          ),
        )
      ],
    );
  }

  Widget _buildStatCard({required String title, required String value, required IconData icon, required Color iconColor, required Color iconBg}) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.9),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppTheme.brand50),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: const TextStyle(color: Color(0xFF64748B), fontSize: 12, fontWeight: FontWeight.w500)),
              const SizedBox(height: 4),
              Text(value, style: const TextStyle(color: Color(0xFF0F172A), fontSize: 24, fontWeight: FontWeight.bold)),
            ],
          ),
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(color: iconBg, borderRadius: BorderRadius.circular(12)),
            child: Icon(icon, color: iconColor),
          )
        ],
      ),
    );
  }

  Widget _buildCoursesTab() {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const Text('My Courses', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Color(0xFF0F172A))),
        const SizedBox(height: 4),
        const Text('Select a course below to view learning materials.', style: TextStyle(color: Color(0xFF64748B))),
        const SizedBox(height: 24),
        if (_courses.isEmpty)
          const Center(child: Padding(padding: EdgeInsets.all(32), child: Text('No courses found.', style: TextStyle(color: Colors.grey))))
        else
          ..._courses.map((course) {
            return Container(
              margin: const EdgeInsets.only(bottom: 16),
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.9),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: Colors.grey.shade200),
                boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 10, offset: const Offset(0, 4))],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(color: AppTheme.brand50, borderRadius: BorderRadius.circular(12)),
                    child: const Icon(Icons.book, color: AppTheme.brand600),
                  ),
                  const SizedBox(height: 16),
                  Text(course['title'] ?? '', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF1E293B))),
                  const SizedBox(height: 8),
                  Text(course['description'] ?? '', style: const TextStyle(fontSize: 14, color: Color(0xFF64748B)), maxLines: 2, overflow: TextOverflow.ellipsis),
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () => _fetchCourseDetails(course['id'].toString()),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF0F172A),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: const Text('View Content', style: TextStyle(fontWeight: FontWeight.bold)),
                    ),
                  )
                ],
              ),
            );
          }).toList()
      ],
    );
  }

  Widget _buildProfileTab() {
    if (_profile == null) return const Center(child: Text('Loading profile...'));

    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const Text('Personal Profile', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Color(0xFF0F172A))),
        const SizedBox(height: 24),
        Container(
          padding: const EdgeInsets.all(24),
          decoration: BoxDecoration(
            color: Colors.white.withOpacity(0.9),
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: AppTheme.brand100),
          ),
          child: Column(
            children: [
              const CircleAvatar(
                radius: 50,
                backgroundColor: AppTheme.brand50,
                child: Icon(Icons.person, size: 50, color: AppTheme.brand300),
              ),
              const SizedBox(height: 16),
              Text(_profile!['name'] ?? '', style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: Color(0xFF1E293B))),
              const SizedBox(height: 4),
              Text(_profile!['email'] ?? '', style: const TextStyle(color: Color(0xFF64748B))),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                decoration: BoxDecoration(
                  color: (_profile!['status'] == 'approved') ? Colors.green.shade100 : Colors.yellow.shade100,
                  borderRadius: BorderRadius.circular(16)
                ),
                child: Text(
                  (_profile!['status'] ?? 'pending').toString().toUpperCase(),
                  style: TextStyle(
                    fontSize: 12, 
                    fontWeight: FontWeight.bold, 
                    color: (_profile!['status'] == 'approved') ? Colors.green.shade700 : Colors.yellow.shade700
                  ),
                ),
              )
            ],
          ),
        ),
      ],
    );
  }
}
