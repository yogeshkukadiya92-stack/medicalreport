import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../main_navigation_screen.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  bool _isOtpMode = true;
  bool _obscurePassword = true;

  final TextEditingController _phoneController = TextEditingController(text: "9876543210");
  final TextEditingController _secretController = TextEditingController(text: "1111");
  String _otpMessage = "";
  bool _isRequestingOtp = false;

  @override
  void dispose() {
    _phoneController.dispose();
    _secretController.dispose();
    super.dispose();
  }

  Future<void> _handleSignIn() async {
    final auth = context.read<AuthProvider>();
    final phone = _phoneController.text.trim();
    final secret = _secretController.text.trim();

    if (phone.isEmpty || secret.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text("Enter credentials to authenticate.")),
      );
      return;
    }

    bool success;
    if (_isOtpMode) {
      success = await auth.signInWithOtp(phone: phone, otp: secret);
    } else {
      success = await auth.signInWithPassword(identifier: phone, password: secret);
    }

    if (success && mounted) {
      Navigator.of(context).pushReplacement(
        PageRouteBuilder(
          pageBuilder: (_, __, ___) => const MainNavigationScreen(),
          transitionsBuilder: (_, animation, __, child) {
            return FadeTransition(opacity: animation, child: child);
          },
          transitionDuration: const Duration(milliseconds: 400),
        ),
      );
    }
  }

  Future<void> _handleRequestOtp() async {
    final phone = _phoneController.text.trim();
    if (phone.length < 10) {
      setState(() => _otpMessage = "Enter valid 10-digit mobile number.");
      return;
    }

    setState(() {
      _isRequestingOtp = true;
      _otpMessage = "";
    });

    final auth = context.read<AuthProvider>();
    final msg = await auth.requestOtp(phone);

    if (mounted) {
      setState(() {
        _isRequestingOtp = false;
        _otpMessage = msg;
        _secretController.text = "1111";
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();

    return Scaffold(
      backgroundColor: const Color(0xFFEEF3F1),
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 420),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Logo Icon
                  Container(
                    height: 52,
                    width: 52,
                    decoration: const BoxDecoration(
                      color: Color(0xFF0D5C46),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.shield_outlined,
                      color: Colors.white,
                      size: 26,
                    ),
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    'MediVault',
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.w900,
                      color: Color(0xFF17222B),
                      letterSpacing: -0.5,
                    ),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Secure Clinical Health Vault',
                    style: TextStyle(
                      fontSize: 12.5,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF71817D),
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Login Card (Matching Web white card with #dce9e5 border)
                  Container(
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: const Color(0xFFDCE9E5)),
                      boxShadow: const [
                        BoxShadow(
                          color: Color(0x0A000000),
                          blurRadius: 10,
                          offset: Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Secure health login',
                          style: TextStyle(
                            fontSize: 17,
                            fontWeight: FontWeight.w800,
                            color: Color(0xFF17222B),
                          ),
                        ),
                        const SizedBox(height: 4),
                        const Text(
                          'Enter your phone to access your family reports.',
                          style: TextStyle(
                            fontSize: 12,
                            color: Color(0xFF71817D),
                          ),
                        ),
                        const SizedBox(height: 20),

                        // Mode Selector (OTP vs Password)
                        Container(
                          padding: const EdgeInsets.all(3),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF7FBFA),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: const Color(0xFFDCE9E5)),
                          ),
                          child: Row(
                            children: [
                              Expanded(
                                child: GestureDetector(
                                  onTap: () => setState(() => _isOtpMode = true),
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(vertical: 8),
                                    alignment: Alignment.center,
                                    decoration: BoxDecoration(
                                      color: _isOtpMode ? const Color(0xFF0D5C46) : Colors.transparent,
                                      borderRadius: BorderRadius.circular(6),
                                    ),
                                    child: Text(
                                      'OTP Login',
                                      style: TextStyle(
                                        fontSize: 11.5,
                                        fontWeight: FontWeight.w800,
                                        color: _isOtpMode ? Colors.white : const Color(0xFF52605D),
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                              Expanded(
                                child: GestureDetector(
                                  onTap: () => setState(() => _isOtpMode = false),
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(vertical: 8),
                                    alignment: Alignment.center,
                                    decoration: BoxDecoration(
                                      color: !_isOtpMode ? const Color(0xFF0D5C46) : Colors.transparent,
                                      borderRadius: BorderRadius.circular(6),
                                    ),
                                    child: Text(
                                      'Password',
                                      style: TextStyle(
                                        fontSize: 11.5,
                                        fontWeight: FontWeight.w800,
                                        color: !_isOtpMode ? Colors.white : const Color(0xFF52605D),
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 18),

                        // Phone Field
                        const Text('Mobile Number', style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.w800, color: Color(0xFF17222B))),
                        const SizedBox(height: 6),
                        TextField(
                          controller: _phoneController,
                          keyboardType: TextInputType.phone,
                          style: const TextStyle(fontSize: 13, color: Color(0xFF17222B), fontWeight: FontWeight.w600),
                          decoration: InputDecoration(
                            prefixIcon: const Padding(
                              padding: EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                              child: Text('+91', style: TextStyle(fontWeight: FontWeight.w800, color: Color(0xFF0D5C46), fontSize: 13)),
                            ),
                            hintText: '9876543210',
                            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(6), borderSide: const BorderSide(color: Color(0xFFD9E4E1))),
                            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(6), borderSide: const BorderSide(color: Color(0xFFD9E4E1))),
                            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(6), borderSide: const BorderSide(color: Color(0xFF0A7D6E), width: 1.5)),
                          ),
                        ),
                        const SizedBox(height: 14),

                        // OTP or Password Field
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              _isOtpMode ? 'Verification Code (OTP)' : 'Password',
                              style: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w800, color: Color(0xFF17222B)),
                            ),
                            if (_isOtpMode)
                              GestureDetector(
                                onTap: _isRequestingOtp ? null : _handleRequestOtp,
                                child: Text(
                                  _isRequestingOtp ? 'Sending...' : 'Get OTP',
                                  style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: Color(0xFF0A7D6E)),
                                ),
                              ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        TextField(
                          controller: _secretController,
                          obscureText: !_isOtpMode && _obscurePassword,
                          keyboardType: _isOtpMode ? TextInputType.number : TextInputType.text,
                          style: const TextStyle(fontSize: 13, color: Color(0xFF17222B), fontWeight: FontWeight.w600),
                          decoration: InputDecoration(
                            hintText: _isOtpMode ? 'Enter OTP (Default: 1111)' : 'Enter account password',
                            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(6), borderSide: const BorderSide(color: Color(0xFFD9E4E1))),
                            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(6), borderSide: const BorderSide(color: Color(0xFFD9E4E1))),
                            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(6), borderSide: const BorderSide(color: Color(0xFF0A7D6E), width: 1.5)),
                            suffixIcon: !_isOtpMode
                                ? IconButton(
                                    icon: Icon(_obscurePassword ? Icons.visibility_off : Icons.visibility, size: 18, color: const Color(0xFF71817D)),
                                    onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                                  )
                                : null,
                          ),
                        ),

                        if (_otpMessage.isNotEmpty) ...[
                          const SizedBox(height: 10),
                          Text(
                            _otpMessage,
                            style: const TextStyle(fontSize: 11, color: Color(0xFF087766), fontWeight: FontWeight.w700),
                          ),
                        ],

                        if (auth.errorMessage.isNotEmpty) ...[
                          const SizedBox(height: 10),
                          Text(
                            auth.errorMessage,
                            style: const TextStyle(fontSize: 11, color: Color(0xFFB8443B), fontWeight: FontWeight.w700),
                          ),
                        ],

                        const SizedBox(height: 20),

                        // Submit Button
                        ElevatedButton(
                          onPressed: auth.isLoading ? null : _handleSignIn,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF0A7D6E),
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                          ),
                          child: auth.isLoading
                              ? const SizedBox(
                                  height: 18,
                                  width: 18,
                                  child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                )
                              : const Text('Sign in to MediVault', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800)),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
