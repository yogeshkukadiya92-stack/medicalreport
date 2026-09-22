import 'package:flutter/material.dart';
import '../core/constants/app_colors.dart';

class StatusBadge extends StatelessWidget {
  final String status;
  final double fontSize;
  final bool showDot;

  const StatusBadge({
    super.key,
    required this.status,
    this.fontSize = 9.0,
    this.showDot = false,
  });

  @override
  Widget build(BuildContext context) {
    Color bg;
    Color fg;

    final lower = status.toLowerCase();
    if (lower == 'high' ||
        lower == 'low' ||
        lower.contains('review') ||
        lower.contains('attention') ||
        lower.contains('critical')) {
      bg = AppColors.criticalSoft;
      fg = AppColors.critical;
    } else if (lower == 'watch' || lower.contains('moderate')) {
      bg = AppColors.warningSoft;
      fg = AppColors.warning;
    } else if (lower == 'processing') {
      bg = AppColors.processingSoft;
      fg = AppColors.processing;
    } else {
      bg = AppColors.normalSoft;
      fg = AppColors.normal;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2.5),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(4),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (showDot) ...[
            Container(
              width: 5,
              height: 5,
              decoration: BoxDecoration(
                color: fg,
                shape: BoxShape.circle,
              ),
            ),
            const SizedBox(width: 4),
          ],
          Text(
            status.toUpperCase(),
            style: TextStyle(
              color: fg,
              fontSize: fontSize,
              fontWeight: FontWeight.w900,
              letterSpacing: 0.4,
            ),
          ),
        ],
      ),
    );
  }
}
