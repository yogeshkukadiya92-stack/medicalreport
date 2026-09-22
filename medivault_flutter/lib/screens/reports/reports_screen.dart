import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../models/report_model.dart';
import '../../providers/vault_provider.dart';
import '../../widgets/custom_app_bar.dart';
import '../../widgets/status_badge.dart';
import 'report_detail_screen.dart';

class ReportsScreen extends StatefulWidget {
  const ReportsScreen({super.key});

  @override
  State<ReportsScreen> createState() => _ReportsScreenState();
}

class _ReportsScreenState extends State<ReportsScreen> {
  final TextEditingController _searchController = TextEditingController();
  String _selectedFilter = 'All';
  final List<String> _filters = ['All', 'Needs review', 'Normal', 'Starred'];

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final vault = context.watch<VaultProvider>();
    final allReports = vault.activeMemberReports;

    final query = _searchController.text.trim().toLowerCase();
    final filteredReports = allReports.where((r) {
      bool matchesFilter = true;
      if (_selectedFilter == 'Needs review') {
        matchesFilter = r.abnormal > 0 || r.status.toLowerCase().contains('review');
      } else if (_selectedFilter == 'Normal') {
        matchesFilter = r.abnormal == 0 && !r.status.toLowerCase().contains('review');
      }

      final matchesQuery = query.isEmpty ||
          r.title.toLowerCase().contains(query) ||
          r.lab.toLowerCase().contains(query) ||
          r.category.toLowerCase().contains(query);
      return matchesFilter && matchesQuery;
    }).toList();

    return Scaffold(
      backgroundColor: const Color(0xFFEEF3F1),
      appBar: const CustomAppBar(
        title: 'Clinical records',
        subtitle: 'All saved lab documents & OCR extractions',
      ),
      body: Column(
        children: [
          // Search & Filter Section
          Container(
            color: Colors.white,
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
            child: Column(
              children: [
                // Search Input
                Container(
                  height: 40,
                  decoration: BoxDecoration(
                    color: const Color(0xFFF7FBFA),
                    borderRadius: BorderRadius.circular(6),
                    border: Border.all(color: const Color(0xFFDCE9E5)),
                  ),
                  child: TextField(
                    controller: _searchController,
                    onChanged: (_) => setState(() {}),
                    style: const TextStyle(color: Color(0xFF101C1C), fontSize: 13),
                    decoration: InputDecoration(
                      hintText: 'Search title, lab or biomarker...',
                      hintStyle: const TextStyle(color: Color(0xFF6F7F7C), fontSize: 12),
                      prefixIcon: const Icon(Icons.search, color: Color(0xFF6F7F7C), size: 18),
                      suffixIcon: query.isNotEmpty
                          ? IconButton(
                              icon: const Icon(Icons.clear, size: 16, color: Color(0xFF6F7F7C)),
                              onPressed: () {
                                _searchController.clear();
                                setState(() {});
                              },
                            )
                          : null,
                      border: InputBorder.none,
                      enabledBorder: InputBorder.none,
                      focusedBorder: InputBorder.none,
                      contentPadding: const EdgeInsets.symmetric(vertical: 10),
                    ),
                  ),
                ),
                const SizedBox(height: 10),

                // Filter Chips
                SizedBox(
                  height: 30,
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
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          alignment: Alignment.center,
                          decoration: BoxDecoration(
                            color: isSelected ? const Color(0xFF0D5C46) : Colors.white,
                            borderRadius: BorderRadius.circular(15),
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
              ],
            ),
          ),

          // Reports List
          Expanded(
            child: filteredReports.isEmpty
                ? Center(
                    child: Padding(
                      padding: const EdgeInsets.all(24.0),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: const [
                          Icon(Icons.folder_open_rounded, size: 48, color: Color(0xFF879590)),
                          SizedBox(height: 12),
                          Text(
                            'No clinical reports found',
                            style: TextStyle(
                              fontSize: 15,
                              fontWeight: FontWeight.w800,
                              color: Color(0xFF17222B),
                            ),
                          ),
                          SizedBox(height: 4),
                          Text(
                            'Try changing filters or upload a new medical document.',
                            style: TextStyle(fontSize: 12, color: Color(0xFF74837F)),
                            textAlign: TextAlign.center,
                          ),
                        ],
                      ),
                    ),
                  )
                : ListView.separated(
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 40),
                    itemCount: filteredReports.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (context, index) {
                      final report = filteredReports[index];
                      return _buildWebReportCard(context, report);
                    },
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildWebReportCard(BuildContext context, AppReportModel report) {
    final hasAttention = report.abnormal > 0;

    return InkWell(
      onTap: () {
        Navigator.of(context).push(
          MaterialPageRoute(
            builder: (_) => ReportDetailScreen(report: report),
          ),
        );
      },
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: const Color(0xFFDCE9E5)),
          boxShadow: const [
            BoxShadow(
              color: Color(0x0A000000),
              blurRadius: 6,
              offset: Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        report.title,
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.w800,
                          color: Color(0xFF101C1C),
                          letterSpacing: -0.2,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${report.lab} · ${report.date}',
                        style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF6F7F7C),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3.5),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF1F6F4),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    report.category,
                    style: const TextStyle(
                      fontSize: 10,
                      fontWeight: FontWeight.w700,
                      color: Color(0xFF52605D),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Summary text
            if (report.summary.isNotEmpty) ...[
              Text(
                report.summary,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  fontSize: 12,
                  color: Color(0xFF52605D),
                  height: 1.4,
                ),
              ),
              const SizedBox(height: 12),
            ],

            const Divider(height: 1, color: Color(0xFFE7EFED)),
            const SizedBox(height: 10),

            // Footer info
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Text(
                      '${report.parameters} biomarkers',
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF74837F),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2.5),
                      decoration: BoxDecoration(
                        color: hasAttention ? const Color(0xFFFFF0EC) : const Color(0xFFEAF9F2),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        hasAttention ? '${report.abnormal} need attention' : 'Normal',
                        style: TextStyle(
                          fontSize: 9.5,
                          fontWeight: FontWeight.w900,
                          color: hasAttention ? const Color(0xFFBA563D) : const Color(0xFF087766),
                        ),
                      ),
                    ),
                  ],
                ),
                const Icon(
                  Icons.arrow_forward_ios_rounded,
                  size: 13,
                  color: Color(0xFF879590),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
