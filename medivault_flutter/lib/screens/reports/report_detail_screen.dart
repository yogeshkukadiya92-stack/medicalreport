import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:share_plus/share_plus.dart';
import '../../core/constants/app_colors.dart';
import '../../models/report_model.dart';
import '../../providers/vault_provider.dart';
import '../../widgets/custom_app_bar.dart';
import '../../widgets/luxury_3d_card.dart';
import '../../widgets/status_badge.dart';

class ReportDetailScreen extends StatefulWidget {
  final AppReportModel report;

  const ReportDetailScreen({super.key, required this.report});

  @override
  State<ReportDetailScreen> createState() => _ReportDetailScreenState();
}

class _ReportDetailScreenState extends State<ReportDetailScreen> {
  final TextEditingController _doctorController = TextEditingController();
  bool _isSharing = false;

  @override
  void dispose() {
    _doctorController.dispose();
    super.dispose();
  }

  Future<void> _handleShare() async {
    setState(() => _isSharing = true);
    final vault = context.read<VaultProvider>();
    final doctorName = _doctorController.text.trim();

    try {
      final shareUrl = await vault.createDoctorShareLink(widget.report.id, doctorName);
      await Share.share(
        'MediVault Secure Medical Report for ${widget.report.title} (Valid for 7 days):\n$shareUrl',
        subject: 'Medical Report - ${widget.report.title}',
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: Colors.white,
            content: Text('Could not share report: $e', style: const TextStyle(color: AppColors.critical)),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isSharing = false);
    }
  }

  Future<void> _confirmDelete() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(18),
          side: const BorderSide(color: AppColors.strokeLight),
        ),
        title: const Text('Delete Report', style: TextStyle(color: AppColors.textPrimary, fontWeight: FontWeight.w700)),
        content: Text(
          'Are you sure you want to delete "${widget.report.title}" from your private vault? This action cannot be undone.',
          style: const TextStyle(color: AppColors.textSecondary, fontSize: 13.5),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(false),
            child: const Text('Cancel', style: TextStyle(color: AppColors.textMuted)),
          ),
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(true),
            style: TextButton.styleFrom(foregroundColor: AppColors.critical),
            child: const Text('Delete', style: TextStyle(fontWeight: FontWeight.w700)),
          ),
        ],
      ),
    );

    if (confirmed == true && mounted) {
      await context.read<VaultProvider>().deleteReport(widget.report.id);
      if (mounted) {
        Navigator.of(context).pop();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final report = widget.report;

    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      appBar: CustomAppBar(
        showBack: true,
        eyebrow: 'REPORT DOSSIER',
        title: report.title,
        action: IconButton(
          icon: const Icon(Icons.delete_outline_rounded, color: AppColors.critical),
          onPressed: _confirmDelete,
        ),
      ),
      body: Stack(
        children: [
          // Background ambient wash
          Positioned(
            top: -60,
            right: -60,
            child: Container(
              width: 280,
              height: 280,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                gradient: AppColors.orbGradient1,
              ),
            ),
          ),

          ListView(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 110),
            children: [
              // Header Card
              Luxury3DCard(
                borderRadius: 20,
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
                          decoration: BoxDecoration(
                            color: AppColors.primarySoft,
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(
                              color: AppColors.primary.withValues(alpha: 0.2),
                              width: 0.8,
                            ),
                          ),
                          child: Text(
                            report.category.toUpperCase(),
                            style: const TextStyle(
                              color: AppColors.primary,
                              fontSize: 9.5,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 0.8,
                            ),
                          ),
                        ),
                        StatusBadge(status: report.status),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text(
                      report.title,
                      style: const TextStyle(
                        color: AppColors.textPrimary,
                        fontSize: 22,
                        fontWeight: FontWeight.w800,
                        letterSpacing: -0.5,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        const Icon(Icons.location_on_outlined, size: 14, color: AppColors.primary),
                        const SizedBox(width: 4),
                        Text(
                          '${report.lab} · ${report.date}',
                          style: const TextStyle(
                            color: AppColors.textSecondary,
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // AI Clinical Summary Card
              if (report.summary.isNotEmpty) ...[
                Container(
                  padding: const EdgeInsets.all(18),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF0F9FF),
                    borderRadius: BorderRadius.circular(18),
                    border: Border.all(
                      color: const Color(0xFFBAE6FD),
                      width: 1,
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.auto_awesome_rounded, color: Color(0xFF0284C7), size: 16),
                          SizedBox(width: 8),
                          Text(
                            'AI CLINICAL INTELLIGENCE SUMMARY',
                            style: TextStyle(
                              color: Color(0xFF0284C7),
                              fontSize: 10,
                              fontWeight: FontWeight.w800,
                              letterSpacing: 0.8,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 10),
                      Text(
                        report.summary,
                        style: const TextStyle(
                          color: Color(0xFF0C4A6E),
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                          height: 1.55,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
              ],

              // Clinical Values Breakdown Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Clinical Values',
                    style: TextStyle(
                      color: AppColors.textPrimary,
                      fontSize: 17,
                      fontWeight: FontWeight.w800,
                      letterSpacing: -0.3,
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: AppColors.primarySoft,
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: Text(
                      '${report.markers.length} parameters',
                      style: const TextStyle(
                        color: AppColors.primary,
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // Markers List
              ...report.markers.map((marker) {
                final isAbnormal = marker.status.toLowerCase() != 'normal';
                return Container(
                  margin: const EdgeInsets.only(bottom: 10),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(
                      color: isAbnormal
                          ? AppColors.critical.withValues(alpha: 0.3)
                          : AppColors.strokeLight,
                      width: 1,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFF0F172A).withValues(alpha: 0.02),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              marker.name,
                              style: const TextStyle(
                                color: AppColors.textPrimary,
                                fontSize: 14,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                            const SizedBox(height: 3),
                            Text(
                              'Reference: ${marker.range}',
                              style: const TextStyle(
                                color: AppColors.textMuted,
                                fontSize: 11.5,
                                fontWeight: FontWeight.w400,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            marker.value,
                            style: TextStyle(
                              color: isAbnormal ? AppColors.critical : AppColors.primary,
                              fontSize: 16,
                              fontWeight: FontWeight.w800,
                              letterSpacing: -0.3,
                            ),
                          ),
                          const SizedBox(height: 4),
                          StatusBadge(status: marker.status, fontSize: 8.5),
                        ],
                      ),
                    ],
                  ),
                );
              }),
              const SizedBox(height: 20),

              // Secure Doctor Share Card
              Luxury3DCard(
                borderRadius: 20,
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Row(
                      children: [
                        Icon(Icons.lock_clock_outlined, color: AppColors.primary, size: 20),
                        SizedBox(width: 10),
                        Text(
                          'SECURE DOCTOR SHARING LINK',
                          style: TextStyle(
                            color: AppColors.primary,
                            fontSize: 10.5,
                            fontWeight: FontWeight.w800,
                            letterSpacing: 0.8,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Generate an end-to-end encrypted, self-revoking 7-day link for your doctor. Only this specific dossier is visible.',
                      style: TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 12.5,
                        fontWeight: FontWeight.w400,
                        height: 1.45,
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Doctor name input
                    Container(
                      decoration: BoxDecoration(
                        color: const Color(0xFFF8FAFC),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                          color: AppColors.strokeLight,
                          width: 1,
                        ),
                      ),
                      child: TextField(
                        controller: _doctorController,
                        style: const TextStyle(color: AppColors.textPrimary, fontSize: 13.5),
                        decoration: const InputDecoration(
                          hintText: 'Doctor or Clinic name (optional)',
                          hintStyle: TextStyle(color: AppColors.textMuted, fontSize: 13),
                          prefixIcon: Icon(Icons.person_pin_outlined, color: AppColors.primary, size: 19),
                          border: InputBorder.none,
                          enabledBorder: InputBorder.none,
                          focusedBorder: InputBorder.none,
                          contentPadding: EdgeInsets.symmetric(horizontal: 14, vertical: 13),
                        ),
                      ),
                    ),
                    const SizedBox(height: 14),

                    GestureDetector(
                      onTap: _isSharing ? null : _handleShare,
                      child: Container(
                        height: 48,
                        decoration: BoxDecoration(
                          color: AppColors.primary,
                          borderRadius: BorderRadius.circular(12),
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.primary.withValues(alpha: 0.3),
                              blurRadius: 14,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        alignment: Alignment.center,
                        child: _isSharing
                            ? const SizedBox(
                                height: 20,
                                width: 20,
                                child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
                              )
                            : const Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(Icons.ios_share_rounded, size: 18, color: Colors.white),
                                  SizedBox(width: 8),
                                  Text(
                                    'GENERATE SECURE 7-DAY LINK',
                                    style: TextStyle(
                                      color: Colors.white,
                                      fontSize: 12.5,
                                      fontWeight: FontWeight.w700,
                                      letterSpacing: 0.6,
                                    ),
                                  ),
                                ],
                              ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
