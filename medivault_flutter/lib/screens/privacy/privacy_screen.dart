import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../providers/auth_provider.dart';
import '../../widgets/custom_app_bar.dart';
import '../../widgets/luxury_3d_card.dart';
import '../auth/login_screen.dart';

class PrivacyScreen extends StatelessWidget {
  const PrivacyScreen({super.key});

  Future<void> _handleSignOut(BuildContext context) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.darkSurface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(18),
          side: BorderSide(color: AppColors.criticalGlow.withValues(alpha: 0.3)),
        ),
        title: const Text(
          'Sign Out of MediVault',
          style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w900),
        ),
        content: const Text(
          'Are you sure you want to securely close your vault session on this device?',
          style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Cancel', style: TextStyle(color: AppColors.textMuted)),
          ),
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            style: TextButton.styleFrom(foregroundColor: AppColors.criticalGlow),
            child: const Text('Sign Out', style: TextStyle(fontWeight: FontWeight.w900)),
          ),
        ],
      ),
    );

    if (confirmed == true && context.mounted) {
      await context.read<AuthProvider>().signOut();
      if (context.mounted) {
        Navigator.of(context).pushAndRemoveUntil(
          MaterialPageRoute(builder: (_) => const LoginScreen()),
          (route) => false,
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.darkBackground,
      appBar: const CustomAppBar(
        showBack: true,
        eyebrow: 'CRYPTOGRAPHIC ARCHITECTURE',
        title: 'Privacy & Security',
      ),
      body: Stack(
        children: [
          // Background ambient glows
          Positioned(
            top: -40,
            right: -40,
            child: Container(
              width: 260,
              height: 260,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                gradient: AppColors.orbGradient1,
              ),
            ),
          ),
          Positioned(
            bottom: 40,
            left: -40,
            child: Container(
              width: 260,
              height: 260,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                gradient: AppColors.orbGradient2,
              ),
            ),
          ),

          ListView(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 40),
            children: [
              // Security Shield Banner (3D Card)
              Luxury3DCard(
                borderRadius: 22,
                padding: const EdgeInsets.all(20),
                child: Row(
                  children: [
                    Container(
                      width: 52,
                      height: 52,
                      decoration: BoxDecoration(
                        gradient: AppColors.neonMintGradient,
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.neonMint.withValues(alpha: 0.4),
                            blurRadius: 14,
                          ),
                        ],
                      ),
                      child: const Icon(Icons.security_rounded, color: Colors.black, size: 28),
                    ),
                    const SizedBox(width: 16),
                    const Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Zero-Knowledge Vault',
                            style: TextStyle(
                              color: AppColors.textPrimary,
                              fontSize: 16,
                              fontWeight: FontWeight.w900,
                              letterSpacing: -0.3,
                            ),
                          ),
                          SizedBox(height: 4),
                          Text(
                            'End-to-end clinical client privacy with military-grade encryption keys.',
                            style: TextStyle(
                              color: AppColors.textSecondary,
                              fontSize: 12.5,
                              height: 1.4,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 18),

              _buildFeatureCard(
                icon: Icons.enhanced_encryption_rounded,
                title: 'AES-256 GCM Cryptography',
                desc: 'Stored health records, diagnostic PDFs, and extracted biomarkers are encrypted using military-grade AES-256 keys on device and cloud.',
              ),
              const SizedBox(height: 12),

              _buildFeatureCard(
                icon: Icons.key_rounded,
                title: 'Revocable Physician Tokens',
                desc: 'When you share a dossier with your doctor, a self-revoking 7-day token is generated. You can revoke access at any time with zero exposure.',
              ),
              const SizedBox(height: 12),

              _buildFeatureCard(
                icon: Icons.fingerprint_rounded,
                title: 'Hardware Secure Enclave',
                desc: 'Biometric authorization tokens are sealed in Apple Keychain (iOS) and Android Keystore hardware security modules.',
              ),
              const SizedBox(height: 24),

              // Sign Out Button
              GestureDetector(
                onTap: () => _handleSignOut(context),
                child: Container(
                  height: 50,
                  decoration: BoxDecoration(
                    color: AppColors.criticalSoft,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: AppColors.criticalGlow.withValues(alpha: 0.35),
                    ),
                  ),
                  alignment: Alignment.center,
                  child: const Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.logout_rounded, size: 18, color: AppColors.criticalGlow),
                      SizedBox(width: 8),
                      Text(
                        'SIGN OUT FROM THIS DEVICE',
                        style: TextStyle(
                          color: AppColors.criticalGlow,
                          fontSize: 12.5,
                          fontWeight: FontWeight.w800,
                          letterSpacing: 0.6,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),

              const Center(
                child: Text(
                  'MediVault Mobile Edition · Build 1024\nHardware KeyStore · Quantum-Resistant Ready',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: AppColors.textMuted,
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                    height: 1.5,
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildFeatureCard({
    required IconData icon,
    required String title,
    required String desc,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF0C1714).withValues(alpha: 0.75),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: AppColors.neonMint.withValues(alpha: 0.18),
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: AppColors.neonMint.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: AppColors.neonMint.withValues(alpha: 0.3),
              ),
            ),
            child: Icon(icon, color: AppColors.neonMint, size: 20),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    color: AppColors.textPrimary,
                    fontSize: 14,
                    fontWeight: FontWeight.w800,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  desc,
                  style: const TextStyle(
                    color: AppColors.textSecondary,
                    fontSize: 11.5,
                    fontWeight: FontWeight.w500,
                    height: 1.45,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
