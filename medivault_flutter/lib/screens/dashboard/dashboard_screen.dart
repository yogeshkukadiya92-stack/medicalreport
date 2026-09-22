import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../models/report_model.dart';
import '../../providers/auth_provider.dart';
import '../../providers/vault_provider.dart';
import '../../widgets/custom_app_bar.dart';
import '../../widgets/status_badge.dart';
import '../privacy/privacy_screen.dart';
import '../reports/report_detail_screen.dart';

class DashboardScreen extends StatefulWidget {
  final VoidCallback onNavigateToUpload;
  final VoidCallback onNavigateToReports;
  final VoidCallback? onNavigateToAnalytics;

  const DashboardScreen({
    super.key,
    required this.onNavigateToUpload,
    required this.onNavigateToReports,
    this.onNavigateToAnalytics,
  });

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  String _selectedFilter = 'All';
  final List<String> _filters = [
    'All',
    'Body',
    'Blood',
    'Diabetes',
    'Thyroid',
    'Liver',
    'Kidney',
  ];

  String _getInitials(String name) {
    final parts = name.trim().split(RegExp(r'\s+'));
    if (parts.isEmpty || parts[0].isEmpty) return 'MV';
    if (parts.length == 1) return parts[0].substring(0, 1).toUpperCase();
    return (parts[0].substring(0, 1) + parts[1].substring(0, 1)).toUpperCase();
  }

  String _testGroup(String category, String reportTitle, String markerName) {
    final source = '$category $reportTitle $markerName'.toLowerCase();
    if (RegExp(r'body composition|inbody|\bbmi\b|body fat|skeletal muscle|visceral fat|body water').hasMatch(source)) {
      return 'Body';
    }
    if (RegExp(r'thyroid|tsh|\bt3\b|\bt4\b').hasMatch(source)) {
      return 'Thyroid';
    }
    if (RegExp(r'diabetes|glucose|hba1c|sugar|insulin').hasMatch(source)) {
      return 'Diabetes';
    }
    if (RegExp(r'liver|bilirubin|sgpt|sgot|alt|ast|albumin').hasMatch(source)) {
      return 'Liver';
    }
    if (RegExp(r'kidney|creatinine|urea|egfr|uric').hasMatch(source)) {
      return 'Kidney';
    }
    if (RegExp(r'blood|cbc|hemoglobin|rbc|wbc|platelet|hematocrit|mcv|mch').hasMatch(source)) {
      return 'Blood';
    }
    return 'All';
  }

  Color _getStatusAccentColor(String status) {
    final lower = status.toLowerCase();
    if (lower == 'high' || lower == 'low') return const Color(0xFFD9534F);
    if (lower == 'watch') return const Color(0xFFD9A514);
    return const Color(0xFF15966F);
  }

  Color _getStatusBgColor(String status) {
    final lower = status.toLowerCase();
    if (lower == 'high' || lower == 'low') return const Color(0xFFFFF0EC);
    if (lower == 'watch') return const Color(0xFFFFF8DC);
    return const Color(0xFFEAF9F2);
  }

  Color _getStatusTextColor(String status) {
    final lower = status.toLowerCase();
    if (lower == 'high' || lower == 'low') return const Color(0xFFB8443B);
    if (lower == 'watch') return const Color(0xFF8A6500);
    return const Color(0xFF087766);
  }

  void _showFamilySwitchSheet(BuildContext context, VaultProvider vault) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 18),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Switch Family Profile',
                      style: TextStyle(
                        fontSize: 17,
                        fontWeight: FontWeight.w900,
                        color: AppColors.textPrimary,
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close, size: 20),
                      onPressed: () => Navigator.pop(ctx),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                ...vault.familyMembers.map((member) {
                  final isSelected = member.id == vault.activeMemberId;
                  return ListTile(
                    contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    leading: CircleAvatar(
                      backgroundColor: isSelected ? const Color(0xFF0D5C46) : const Color(0xFFEFF5F3),
                      foregroundColor: isSelected ? Colors.white : const Color(0xFF17222B),
                      child: Text(
                        _getInitials(member.name),
                        style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 11),
                      ),
                    ),
                    title: Text(
                      member.name,
                      style: TextStyle(
                        fontWeight: FontWeight.w800,
                        color: isSelected ? const Color(0xFF087766) : const Color(0xFF17222B),
                      ),
                    ),
                    subtitle: Text('${member.relation} · ${member.age} yrs · ${member.bloodGroup}'),
                    trailing: isSelected
                        ? const Icon(Icons.check_circle_rounded, color: Color(0xFF087766), size: 20)
                        : null,
                    onTap: () {
                      vault.selectMember(member.id);
                      Navigator.pop(ctx);
                    },
                  );
                }),
              ],
            ),
          ),
        );
      },
    );
  }

  void _showResultHistoryModal(
    BuildContext context,
    String markerName,
    String currentValue,
    String status,
    String range,
    String lab,
    String reportId,
    List<AppReportModel> allReports,
  ) {
    // Extract history of this marker
    final List<Map<String, dynamic>> history = [];
    for (final r in allReports) {
      for (final m in r.markers) {
        if (m.name.trim().toLowerCase() == markerName.trim().toLowerCase()) {
          final numVal = m.numericValue;
          if (numVal != null) {
            history.add({
              'date': r.date,
              'value': numVal,
              'valueStr': m.value,
              'status': m.status,
            });
          }
        }
      }
    }
    history.sort((a, b) => (a['date'] as String).compareTo(b['date'] as String));

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(18)),
      ),
      builder: (ctx) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'RESULT HISTORY',
                          style: TextStyle(
                            fontSize: 9,
                            fontWeight: FontWeight.w900,
                            color: Color(0xFF087766),
                            letterSpacing: 0.8,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          markerName,
                          style: const TextStyle(
                            fontSize: 19,
                            fontWeight: FontWeight.w900,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        Text(
                          '$lab · normalized timeline',
                          style: const TextStyle(
                            fontSize: 10.5,
                            fontWeight: FontWeight.w600,
                            color: AppColors.textSecondary,
                          ),
                        ),
                      ],
                    ),
                    IconButton(
                      icon: const Icon(Icons.close, size: 20, color: AppColors.textSecondary),
                      onPressed: () => Navigator.pop(ctx),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Latest reading',
                          style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: AppColors.textSecondary),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          currentValue,
                          style: const TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.w900,
                            color: AppColors.textPrimary,
                          ),
                        ),
                      ],
                    ),
                    StatusBadge(status: status, fontSize: 10),
                  ],
                ),
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FBFA),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: AppColors.strokeLight),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            '${history.length} reading${history.length == 1 ? '' : 's'}',
                            style: const TextStyle(fontSize: 9.5, fontWeight: FontWeight.w700, color: AppColors.textMuted),
                          ),
                          Text(
                            'Reference: ${range.isNotEmpty ? range : 'standard range'}',
                            style: const TextStyle(fontSize: 9.5, fontWeight: FontWeight.w700, color: AppColors.textMuted),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      SizedBox(
                        height: 90,
                        width: double.infinity,
                        child: CustomPaint(
                          painter: _HistoryGraphPainter(
                            history: history,
                            lineColor: _getStatusAccentColor(status),
                          ),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            history.isNotEmpty ? history.first['date'] as String : '',
                            style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w600, color: AppColors.textSecondary),
                          ),
                          Text(
                            history.length > 1 ? history.last['date'] as String : 'Latest',
                            style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w600, color: AppColors.textSecondary),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        style: OutlinedButton.styleFrom(
                          side: const BorderSide(color: Color(0xFFCFDED9)),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                          padding: const EdgeInsets.symmetric(vertical: 12),
                        ),
                        onPressed: () {
                          Navigator.pop(ctx);
                          final matchedReport = allReports.firstWhere(
                            (r) => r.id == reportId,
                            orElse: () => allReports.first,
                          );
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => ReportDetailScreen(report: matchedReport),
                            ),
                          );
                        },
                        child: const Text(
                          'Open report',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w800,
                            color: Color(0xFF0D5C46),
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: ElevatedButton(
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF0D5C46),
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(6)),
                          padding: const EdgeInsets.symmetric(vertical: 12),
                        ),
                        onPressed: () {
                          Navigator.pop(ctx);
                          widget.onNavigateToAnalytics?.call();
                        },
                        child: const Text(
                          'Full analytics',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w800,
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final vault = context.watch<VaultProvider>();
    final auth = context.watch<AuthProvider>();
    final activeMember = vault.activeMember;
    final reports = vault.activeMemberReports;
    final score = vault.healthScore;
    final connectedLabs = vault.connectedLabsCount;

    // Collect distinct biomarkers for the timeline list
    final List<Map<String, dynamic>> allResults = [];
    final Set<String> seenMarkers = {};

    for (final report in reports) {
      for (final marker in report.markers) {
        final key = marker.name.trim().toLowerCase();
        if (key.isNotEmpty && !seenMarkers.contains(key)) {
          seenMarkers.add(key);
          allResults.add({
            'name': marker.name,
            'value': marker.value,
            'status': marker.status,
            'range': marker.range,
            'lab': report.lab,
            'date': report.date,
            'category': report.category,
            'reportTitle': report.title,
            'reportId': report.id,
          });
        }
      }
    }

    // Filter results
    final visibleResults = allResults.where((item) {
      if (_selectedFilter == 'All') return true;
      return _testGroup(
            item['category'] as String,
            item['reportTitle'] as String,
            item['name'] as String,
          ) ==
          _selectedFilter;
    }).toList();

    final attentionCount = allResults.where((item) => (item['status'] as String) != 'Normal').length;
    final latestDate = reports.isNotEmpty ? reports.first.date : 'No reports yet';

    return Scaffold(
      backgroundColor: const Color(0xFFEEF3F1),
      appBar: CustomAppBar(
        avatarInitials: _getInitials(activeMember?.name ?? auth.user?.name ?? 'MediVault'),
        title: 'Unified Timeline',
        subtitle: 'All connected lab results',
        action: GestureDetector(
          onTap: () {
            Navigator.of(context).push(
              MaterialPageRoute(builder: (_) => const PrivacyScreen()),
            );
          },
          child: Container(
            height: 36,
            width: 36,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(6),
              border: Border.all(color: const Color(0xFFD7E4E0)),
            ),
            child: const Icon(
              Icons.shield_outlined,
              color: Color(0xFF0D5C46),
              size: 18,
            ),
          ),
        ),
      ),
      body: RefreshIndicator(
        color: const Color(0xFF0D5C46),
        backgroundColor: Colors.white,
        onRefresh: () => vault.loadVault(),
        child: ListView(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 40),
          children: [
            // Active Member & Health Score Banner
            if (activeMember != null) ...[
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        activeMember.name,
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.w900,
                          color: Color(0xFF17222B),
                          letterSpacing: -0.4,
                        ),
                      ),
                      const SizedBox(height: 3),
                      Row(
                        children: [
                          const Text(
                            'HEALTH SCORE  ',
                            style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w900,
                              color: Color(0xFF61716D),
                              letterSpacing: 0.5,
                            ),
                          ),
                          Text(
                            reports.isNotEmpty ? '$score' : '--',
                            style: const TextStyle(
                              fontSize: 19,
                              fontWeight: FontWeight.w900,
                              color: Color(0xFF0D5C46),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 2),
                      Text(
                        'Last synced: $latestDate',
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF74837F),
                        ),
                      ),
                    ],
                  ),
                  GestureDetector(
                    onTap: () => _showFamilySwitchSheet(context, vault),
                    child: Container(
                      height: 36,
                      padding: const EdgeInsets.symmetric(horizontal: 12),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(color: const Color(0xFFCFDED9)),
                      ),
                      child: const Row(
                        children: [
                          Icon(Icons.people_outline_rounded, size: 16, color: Color(0xFF263633)),
                          SizedBox(width: 6),
                          Text(
                            'Switch',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w900,
                              color: Color(0xFF263633),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 14),
            ],

            // Category Filter Pills (Horizontal Scroll)
            SizedBox(
              height: 32,
              child: ListView.separated(
                scrollDirection: Axis.horizontal,
                itemCount: _filters.length,
                separatorBuilder: (_, __) => const SizedBox(width: 8),
                itemBuilder: (context, index) {
                  final filter = _filters[index];
                  final isSelected = _selectedFilter == filter;
                  return GestureDetector(
                    onTap: () => setState(() => _selectedFilter = filter),
                    child: Container(
                      height: 32,
                      padding: const EdgeInsets.symmetric(horizontal: 14),
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: isSelected ? const Color(0xFF0D5C46) : Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: isSelected ? const Color(0xFF0D5C46) : const Color(0xFFCFDED9),
                        ),
                      ),
                      child: Text(
                        filter,
                        style: TextStyle(
                          color: isSelected ? Colors.white : const Color(0xFF52605D),
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
            const SizedBox(height: 14),

            // Live Vault Sync Banner (Matching Web bg-[#bdf5e8])
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFBDF5E8),
                borderRadius: BorderRadius.circular(6),
              ),
              child: Row(
                children: [
                  Container(
                    height: 32,
                    width: 32,
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.7),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: const Icon(
                      Icons.trending_up_rounded,
                      color: Color(0xFF0B5F52),
                      size: 18,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'LIVE VAULT SYNC',
                          style: TextStyle(
                            color: Color(0xFF0B5F52),
                            fontSize: 9,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 0.6,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          '${reports.length} reports from $connectedLabs connected lab${connectedLabs == 1 ? '' : 's'}',
                          style: const TextStyle(
                            color: Color(0xFF0B5F52),
                            fontSize: 12,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Health Results Header
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                const Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Health results',
                      style: TextStyle(
                        color: Color(0xFF17222B),
                        fontSize: 16,
                        fontWeight: FontWeight.w800,
                        letterSpacing: -0.3,
                      ),
                    ),
                    SizedBox(height: 2),
                    Text(
                      'Latest verified parameters from lab reports',
                      style: TextStyle(
                        color: Color(0xFF71817D),
                        fontSize: 11.5,
                      ),
                    ),
                  ],
                ),
                if (attentionCount > 0)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFF0EC),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      '$attentionCount need attention',
                      style: const TextStyle(
                        color: Color(0xFFB8443B),
                        fontSize: 10,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  )
                else
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFFEAF9F2),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: const Text(
                      'All clear',
                      style: TextStyle(
                        color: Color(0xFF087766),
                        fontSize: 10,
                        fontWeight: FontWeight.w900,
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 12),

            // Health Results Card List (Matching Web divide-y border container)
            if (visibleResults.isNotEmpty)
              Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(color: const Color(0xFFDBE6E3)),
                ),
                child: ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: visibleResults.length,
                  separatorBuilder: (_, __) => const Divider(
                    height: 1,
                    thickness: 1,
                    color: Color(0xFFE7EFED),
                  ),
                  itemBuilder: (context, index) {
                    final item = visibleResults[index];
                    final status = item['status'] as String;
                    final accentColor = _getStatusAccentColor(status);
                    final iconBg = _getStatusBgColor(status);
                    final iconFg = _getStatusTextColor(status);

                    return InkWell(
                      onTap: () => _showResultHistoryModal(
                        context,
                        item['name'] as String,
                        item['value'] as String,
                        status,
                        item['range'] as String,
                        item['lab'] as String,
                        item['reportId'] as String,
                        reports,
                      ),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                        decoration: BoxDecoration(
                          border: Border(
                            left: BorderSide(color: accentColor, width: 3),
                          ),
                        ),
                        child: Row(
                          children: [
                            Container(
                              height: 34,
                              width: 34,
                              decoration: BoxDecoration(
                                color: iconBg,
                                shape: BoxShape.circle,
                              ),
                              child: Icon(
                                status == 'Normal' ? Icons.trending_up_rounded : Icons.notifications_none_rounded,
                                color: iconFg,
                                size: 16,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Flexible(
                                        child: Text(
                                          item['name'] as String,
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis,
                                          style: const TextStyle(
                                            color: Color(0xFF17222B),
                                            fontSize: 13,
                                            fontWeight: FontWeight.w800,
                                          ),
                                        ),
                                      ),
                                      const SizedBox(width: 6),
                                      StatusBadge(status: status),
                                    ],
                                  ),
                                  const SizedBox(height: 3),
                                  Text(
                                    '${item['lab']} · ${item['date']}',
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(
                                      color: Color(0xFF74837F),
                                      fontSize: 10,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const SizedBox(width: 8),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Text(
                                  item['value'] as String,
                                  style: const TextStyle(
                                    color: Color(0xFF17222B),
                                    fontSize: 14,
                                    fontWeight: FontWeight.w900,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                const Text(
                                  'View trend',
                                  style: TextStyle(
                                    color: Color(0xFF879590),
                                    fontSize: 9,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    );
                  },
                ),
              )
            else
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(color: const Color(0xFFC5D8D3), style: BorderStyle.solid),
                ),
                child: Column(
                  children: [
                    Text(
                      'No ${_selectedFilter == "All" ? "health" : _selectedFilter.toLowerCase()} results',
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w900,
                        color: Color(0xFF17222B),
                      ),
                    ),
                    const SizedBox(height: 4),
                    const Text(
                      'Upload or connect a matching lab report to see data here.',
                      textAlign: TextAlign.center,
                      style: TextStyle(fontSize: 11, color: Color(0xFF74837F)),
                    ),
                  ],
                ),
              ),

            const SizedBox(height: 16),

            // Quick Actions Grid (Matching Web 3 buttons)
            Row(
              children: [
                Expanded(
                  child: _buildQuickActionButton(
                    icon: Icons.shield_outlined,
                    label: 'Secure share',
                    onTap: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(builder: (_) => const PrivacyScreen()),
                      );
                    },
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _buildQuickActionButton(
                    icon: Icons.article_outlined,
                    label: 'Reports',
                    onTap: widget.onNavigateToReports,
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _buildQuickActionButton(
                    icon: Icons.show_chart_rounded,
                    label: 'Full history',
                    onTap: () => widget.onNavigateToAnalytics?.call(),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildQuickActionButton({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      child: Container(
        height: 40,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(6),
          border: Border.all(color: const Color(0xFFDBE6E3)),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, size: 15, color: const Color(0xFF52605D)),
            const SizedBox(width: 5),
            Text(
              label,
              style: const TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w900,
                color: Color(0xFF52605D),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _HistoryGraphPainter extends CustomPainter {
  final List<Map<String, dynamic>> history;
  final Color lineColor;

  _HistoryGraphPainter({required this.history, required this.lineColor});

  @override
  void paint(Canvas canvas, Size size) {
    // Draw background reference range zones (coral high, mint normal, amber low)
    final topZone = Rect.fromLTWH(0, 0, size.width, size.height * 0.3);
    final midZone = Rect.fromLTWH(0, size.height * 0.3, size.width, size.height * 0.4);
    final botZone = Rect.fromLTWH(0, size.height * 0.7, size.width, size.height * 0.3);

    final pTop = Paint()..color = const Color(0xFFFFF0EC).withValues(alpha: 0.75);
    final pMid = Paint()..color = const Color(0xFFEAF9F2);
    final pBot = Paint()..color = const Color(0xFFFFF8DC).withValues(alpha: 0.8);

    canvas.drawRect(topZone, pTop);
    canvas.drawRect(midZone, pMid);
    canvas.drawRect(botZone, pBot);

    // Draw dashed grid lines
    final pGrid = Paint()
      ..color = const Color(0xFFCDDBD7)
      ..strokeWidth = 1
      ..style = PaintingStyle.stroke;

    for (final yRatio in [0.2, 0.5, 0.8]) {
      final y = size.height * yRatio;
      canvas.drawLine(Offset(0, y), Offset(size.width, y), pGrid);
    }

    if (history.isEmpty) return;

    final values = history.map((e) => (e['value'] as num).toDouble()).toList();
    final minVal = values.reduce((a, b) => a < b ? a : b);
    final maxVal = values.reduce((a, b) => a > b ? a : b);
    final spread = (maxVal - minVal) == 0 ? 1.0 : (maxVal - minVal);

    final points = <Offset>[];
    for (int i = 0; i < history.length; i++) {
      final x = history.length == 1
          ? size.width / 2
          : (i / (history.length - 1)) * (size.width - 24) + 12;
      final normalized = (values[i] - minVal) / spread;
      final y = size.height - 12 - (normalized * (size.height - 24));
      points.add(Offset(x, y));
    }

    // Draw curve
    final pLine = Paint()
      ..color = lineColor
      ..strokeWidth = 2.5
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round
      ..strokeJoin = StrokeJoin.round;

    final path = Path();
    path.moveTo(points.first.dx, points.first.dy);
    for (int i = 1; i < points.length; i++) {
      path.lineTo(points[i].dx, points[i].dy);
    }
    canvas.drawPath(path, pLine);

    // Draw circular dots
    final pDotFill = Paint()..color = Colors.white;
    final pDotStroke = Paint()
      ..color = lineColor
      ..strokeWidth = 2.5
      ..style = PaintingStyle.stroke;

    for (final pt in points) {
      canvas.drawCircle(pt, 4.5, pDotFill);
      canvas.drawCircle(pt, 4.5, pDotStroke);
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}
