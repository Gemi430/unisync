import 'dart:ui';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import 'package:http/http.dart' as http;
import '../core/theme.dart';

class RegisterPage extends StatefulWidget {
  final bool isAdmin;
  const RegisterPage({super.key, this.isAdmin = false});

  @override
  State<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends State<RegisterPage> {
  final _formKey = GlobalKey<FormState>();
  String _stream = 'natural';
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  PlatformFile? _selectedFile;

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  bool _isLoading = false;

  Future<void> _handleSubmit() async {
    if (_formKey.currentState!.validate()) {
      if (_selectedFile == null) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Please upload your payment receipt.')),
        );
        return;
      }

      setState(() => _isLoading = true);

      try {
        var uri = Uri.parse('https://uni-resource-backend.onrender.com/api/auth/register'); // Standard localhost for edge/windows
        var request = http.MultipartRequest('POST', uri);
        
        request.fields['name'] = _nameController.text;
        request.fields['email'] = _emailController.text;
        request.fields['password'] = _passwordController.text;
        request.fields['stream'] = _stream;
        
        if (_selectedFile!.bytes != null) {
          // Works on Web
          request.files.add(http.MultipartFile.fromBytes(
            'receipt',
            _selectedFile!.bytes!,
            filename: _selectedFile!.name,
          ));
        } else if (_selectedFile!.path != null) {
          // Works on Desktop/Mobile
          request.files.add(await http.MultipartFile.fromPath(
            'receipt',
            _selectedFile!.path!,
          ));
        }

        var streamedResponse = await request.send();
        var response = await http.Response.fromStream(streamedResponse);
        var responseData = json.decode(response.body);

        if (response.statusCode == 200 || response.statusCode == 201) {
          if (!mounted) return;
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(responseData['message'] ?? 'Registration successful!'), backgroundColor: AppTheme.accent600),
          );
          Navigator.pushReplacementNamed(context, '/login');
        } else {
          if (!mounted) return;
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(responseData['error'] ?? 'Registration failed'), backgroundColor: AppTheme.social600),
          );
        }
      } catch (e) {
        if (!mounted) return;
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Network error: $e'), backgroundColor: AppTheme.social600),
        );
      } finally {
        if (mounted) {
          setState(() => _isLoading = false);
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          color: AppTheme.bgMain, // slate-50
        ),
        child: Stack(
          children: [
            // Background Decor 1
            Positioned(
              top: -50,
              right: -50,
              child: Container(
                width: 300,
                height: 300,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppTheme.accent500.withOpacity(0.2),
                ),
              ),
            ),
            // Background Decor 2
            Positioned(
              bottom: -50,
              left: -50,
              child: Container(
                width: 300,
                height: 300,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppTheme.brand500.withOpacity(0.2),
                ),
              ),
            ),
            // Blur for decor
            Positioned.fill(
              child: BackdropFilter(
                filter: ImageFilter.blur(sigmaX: 120, sigmaY: 120),
                child: Container(color: Colors.transparent),
              ),
            ),
            // Content
            SafeArea(
              child: Center(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(24.0),
                  child: Container(
                    padding: const EdgeInsets.all(32),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.8),
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(color: AppTheme.borderColor),
                    ),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Text(
                          'Create Account',
                          style: TextStyle(
                            fontSize: 32,
                            fontWeight: FontWeight.w800,
                            color: Color(0xFF0F172A),
                          ),
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          'Join UniSync to start accessing your stream\'s premium resources.',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 14,
                            color: Color(0xFF64748B), // text-slate-500
                          ),
                        ),
                        const SizedBox(height: 32),
                        Form(
                          key: _formKey,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Expanded(
                                    child: _buildTextField(
                                      label: 'Full Name',
                                      hint: 'John Doe',
                                      controller: _nameController,
                                      validator: (val) => val!.isEmpty ? 'Required' : null,
                                    ),
                                  ),
                                  const SizedBox(width: 16),
                                  Expanded(
                                    child: _buildStreamDropdown(),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 16),
                              _buildTextField(
                                label: 'Email',
                                hint: 'student@uni.edu',
                                controller: _emailController,
                                keyboardType: TextInputType.emailAddress,
                                validator: (val) => val!.isEmpty || !val.contains('@') ? 'Invalid Email' : null,
                              ),
                              const SizedBox(height: 16),
                              _buildTextField(
                                label: 'Password',
                                hint: '••••••••',
                                controller: _passwordController,
                                obscureText: true,
                                validator: (val) => val!.length < 6 ? 'Password too short' : null,
                              ),
                              const SizedBox(height: 16),
                              // Payment Receipt UI Mockup
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text('Payment Receipt', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: Color(0xFF334155))),
                                  const SizedBox(height: 8),
                                  InkWell(
                                    onTap: () async {
                                      FilePickerResult? result = await FilePicker.platform.pickFiles(
                                        type: FileType.custom,
                                        allowedExtensions: ['jpg', 'pdf', 'png', 'jpeg'],
                                      );

                                      if (result != null) {
                                        setState(() {
                                          _selectedFile = result.files.first;
                                        });
                                      }
                                    },
                                    child: Container(
                                      width: double.infinity,
                                      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 16),
                                      decoration: BoxDecoration(
                                        color: Colors.white.withOpacity(0.3),
                                        borderRadius: BorderRadius.circular(12),
                                        border: Border.all(color: const Color(0xFFCBD5E1), style: BorderStyle.none),
                                      ),
                                      child: Row(
                                        mainAxisAlignment: MainAxisAlignment.center,
                                        children: [
                                          const Icon(Icons.upload_file, color: AppTheme.brand500),
                                          const SizedBox(width: 8),
                                          const Text('Choose File', style: TextStyle(color: AppTheme.brand600, fontWeight: FontWeight.bold)),
                                          const SizedBox(width: 8),
                                          Flexible(
                                            child: Text(
                                              _selectedFile != null ? _selectedFile!.name : 'No file chosen',
                                              style: const TextStyle(color: Color(0xFF475569)),
                                              overflow: TextOverflow.ellipsis,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                  const SizedBox(height: 8),
                                  const Text(
                                    'Upload an image or PDF of your tuition receipt. Account approval is required before access.',
                                    style: TextStyle(fontSize: 12, color: Color(0xFF64748B)),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 24),
                              ElevatedButton(
                                onPressed: _isLoading ? null : _handleSubmit,
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: const Color(0xFF0F172A),
                                  foregroundColor: Colors.white,
                                  padding: const EdgeInsets.symmetric(vertical: 16),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                ),
                                child: _isLoading 
                                  ? const SizedBox(height: 24, width: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                                  : const Text('Submit Application', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 32),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Text('Already have an account? ', style: TextStyle(color: Color(0xFF475569))),
                            InkWell(
                              onTap: () => Navigator.pushReplacementNamed(context, '/login'),
                              child: const Text('Log in here', style: TextStyle(color: AppTheme.brand600, fontWeight: FontWeight.bold)),
                            )
                          ],
                        )
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTextField({
    required String label,
    required String hint,
    required TextEditingController controller,
    bool obscureText = false,
    TextInputType? keyboardType,
    String? Function(String?)? validator,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: Color(0xFF334155))),
        const SizedBox(height: 8),
        TextFormField(
          controller: controller,
          obscureText: obscureText,
          keyboardType: keyboardType,
          validator: validator,
          decoration: InputDecoration(
            hintText: hint,
            filled: true,
            fillColor: Colors.white.withOpacity(0.5),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          ),
        ),
      ],
    );
  }

  Widget _buildStreamDropdown() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Stream', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: Color(0xFF334155))),
        const SizedBox(height: 8),
        DropdownButtonFormField<String>(
          value: _stream,
          decoration: InputDecoration(
            filled: true,
            fillColor: Colors.white.withOpacity(0.5),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Color(0xFFE2E8F0))),
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          ),
          items: const [
            DropdownMenuItem(value: 'natural', child: Text('Natural Stream')),
            DropdownMenuItem(value: 'social', child: Text('Social Stream')),
          ],
          onChanged: (val) {
            if (val != null) {
              setState(() => _stream = val);
            }
          },
        ),
      ],
    );
  }
}
