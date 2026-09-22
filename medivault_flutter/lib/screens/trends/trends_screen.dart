import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/trend_point_model.dart';
import '../../providers/vault_provider.dart';
import '../../widgets/custom_app_bar.dart';
import '../../widgets/status_badge.dart';

class TrendsScreen extends StatefulWidget {
  const TrendsScreen({super.key});

  @override
  State<TrendsScreen> createState() => _TrendsScreenState();
}

class _TrendsScreenState extends State<TrendsScreen> {
  String _selectedRange = 'ALL';
  final List<String> _ranges = ['30D', '90D', '6M', '1Y', 'ALL'];

  @override
  Widget build(BuildContext context) {
    final vault = context.watch<VaultProvider>();
    final trends = vault.getBiomarkerTrends();

    return Scaffold(
      backgroundColor: const Color(0xFFEEF3F1),
      appBar: const CustomAppBar(
        title: 'Health analytics',
        subtitle: 'Longitudinal biomarker trends & charts',
      ),
      body: Column(
        children: [
          // Time range selector bar
          Container(
            color: Colors.white,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: _ranges.map((range) {
                final isSelected = _selectedRange == range;
                return GestureDetector(
                  onTap: () => setState(() => _selectedRange = range),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                    decoration: BoxDecoration(
                      color: isSelected ? const Color(0xFF0D5C46) : Colors.transparent,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: isSelected ? const Color(0xFF0D5C46) : const Color(0xFFCFDED9),
                      ),
                    ),
                    child: Text(
                      range,
                      style: TextStyle(
                        color: isSelected ? Colors.white : const Color(0xFF52605D),
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),

          Expanded(
            child: trends.isEmpty
                ? const Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.show_chart_rounded, size: 48, color: Color(0xFF879590)),
                        SizedBox(height: 12),
                        Text(
                          'No biomarker trends yet',
                          style: TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w800,
                            color: Color(0xFF17222B),
                          ),
                        ),
                        SizedBox(height: 4),
                        Text(
                          'Upload multiple reports over time to see trends.',
                          style: TextStyle(fontSize: 12, color: Color(0xFF879590)),
                        ),
                      ],
                    ),
                  )
                : ListView.separated(
                    padding: const EdgeInsets.fromLTRB(16, 16, 16, 40),
                    itemCount: trends.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 14),
                    itemBuilder: (context, index) {
                      final trend = trends[index];
                      return _buildTrendCard(trend);
                    },
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildTrendCard(BiomarkerTrend trend) {
    final latest = trend.latest;
    final points = trend.points;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: const Color(0xFFDBE6E3)),
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
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    trend.name,
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF17222B),
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    '${points.length} reading${points.length == 1 ? '' : 's'} · Latest: ${latest?.date ?? "N/A"}',
                    style: const TextStyle(
                      fontSize: 10.5,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF74837F),
                    ),
                  ),
                ],
              ),
              if (latest != null)
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      latest.valueLabel,
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w900,
                        color: Color(0xFF17222B),
                      ),
                    ),
                    const SizedBox(height: 3),
                    StatusBadge(status: latest.status),
                  ],
                ),
            ],
          ),
          const SizedBox(height: 14),

          // Chart
          SizedBox(
            height: 120,
            child: points.length == 1
                ? Center(
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF7FBFA),
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(color: const Color(0xFFDBE6E3)),
                      ),
                      child: Text(
                        'Single measurement: ${points.first.valueLabel} (${points.first.date})',
                        style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: Color(0xFF52605D)),
                      ),
                    ),
                  )
                : LineChart(
                    LineChartData(
                      gridData: FlGridData(
                        show: true,
                        drawVerticalLine: false,
                        getDrawingHorizontalLine: (value) => const FlLine(
                          color: Color(0xFFE7EFED),
                          strokeWidth: 1,
                          dashArray: [4, 4],
                        ),
                      ),
                      titlesData: FlTitlesData(
                        show: true,
                        topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                        rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                        bottomTitles: AxisTitles(
                          sideTitles: SideTitles(
                            showTitles: true,
                            reservedSize: 22,
                            interval: 1,
                            getTitlesWidget: (value, meta) {
                              final idx = value.toInt();
                              if (idx >= 0 && idx < points.length) {
                                final parts = points[idx].date.split('-');
                                final label = parts.length >= 2 ? '${parts[1]}/${parts[0].substring(2)}' : points[idx].date;
                                return Text(
                                  label,
                                  style: const TextStyle(color: Color(0xFF879590), fontSize: 9, fontWeight: FontWeight.w600),
                                );
                              }
                              return const SizedBox.shrink();
                            },
                          ),
                        ),
                        leftTitles: AxisTitles(
                          sideTitles: SideTitles(
                            showTitles: true,
                            reservedSize: 36,
                            getTitlesWidget: (value, meta) {
                              return Text(
                                value.toStringAsFixed(0),
                                style: const TextStyle(color: Color(0xFF879590), fontSize: 9, fontWeight: FontWeight.w600),
                              );
                            },
                          ),
                        ),
                      ),
                      borderData: FlBorderData(show: false),
                      lineBarsData: [
                        LineChartBarData(
                          spots: points.asMap().entries.map((e) {
                            return FlSpot(e.key.toDouble(), e.value.value);
                          }).toList(),
                          isCurved: true,
                          curveSmoothness: 0.35,
                          color: const Color(0xFF0A7D6E),
                          barWidth: 2.5,
                          isStrokeCapRound: true,
                          dotData: FlDotData(
                            show: true,
                            getDotPainter: (spot, percent, barData, index) {
                              return FlDotCirclePainter(
                                radius: 4,
                                color: Colors.white,
                                strokeWidth: 2.5,
                                strokeColor: const Color(0xFF0A7D6E),
                              );
                            },
                          ),
                          belowBarData: BarAreaData(
                            show: true,
                            color: const Color(0xFF0A7D6E).withValues(alpha: 0.08),
                          ),
                        ),
                      ],
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}
