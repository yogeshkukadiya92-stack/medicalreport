import 'dart:math';
import 'package:flutter/material.dart';
import '../core/constants/app_colors.dart';

/// Clinical Precision Biometric Ring (Apple Health / Withings Standard)
class HealthScoreGauge extends StatefulWidget {
  final int score;
  final double size;

  const HealthScoreGauge({
    super.key,
    required this.score,
    this.size = 120.0,
  });

  @override
  State<HealthScoreGauge> createState() => _HealthScoreGaugeState();
}

class _HealthScoreGaugeState extends State<HealthScoreGauge> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1400),
    );
    _animation = Tween<double>(begin: 0, end: (widget.score / 100.0).clamp(0.0, 1.0)).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOutCubic),
    );
    _controller.forward();
  }

  @override
  void didUpdateWidget(covariant HealthScoreGauge oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.score != widget.score) {
      _animation = Tween<double>(
        begin: _animation.value,
        end: (widget.score / 100.0).clamp(0.0, 1.0),
      ).animate(
        CurvedAnimation(parent: _controller, curve: Curves.easeOutCubic),
      );
      _controller.forward(from: 0);
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  Color _getStatusColor() {
    if (widget.score >= 80) return AppColors.normal;
    if (widget.score >= 60) return AppColors.warning;
    return AppColors.critical;
  }

  Color _getStatusBg() {
    if (widget.score >= 80) return AppColors.normalSoft;
    if (widget.score >= 60) return AppColors.warningSoft;
    return AppColors.criticalSoft;
  }

  String _getStatusLabel() {
    if (widget.score >= 80) return 'OPTIMAL';
    if (widget.score >= 60) return 'WATCH';
    return 'ATTENTION';
  }

  @override
  Widget build(BuildContext context) {
    final statusColor = _getStatusColor();
    final statusBg = _getStatusBg();
    final statusLabel = _getStatusLabel();

    return AnimatedBuilder(
      animation: _animation,
      builder: (context, child) {
        final currentScore = (_animation.value * 100).round();

        return SizedBox(
          width: widget.size,
          height: widget.size,
          child: Stack(
            alignment: Alignment.center,
            children: [
              // Clean Medical Circular Ring
              CustomPaint(
                size: Size(widget.size, widget.size),
                painter: _ClinicalRingPainter(
                  progress: _animation.value,
                  accentColor: statusColor,
                ),
              ),

              // Digital Score Center Display
              Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    widget.score > 0 ? '$currentScore' : '--',
                    style: const TextStyle(
                      color: AppColors.textPrimary,
                      fontSize: 32,
                      fontWeight: FontWeight.w900,
                      letterSpacing: -1.0,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2.5),
                    decoration: BoxDecoration(
                      color: statusBg,
                      borderRadius: BorderRadius.circular(5),
                      border: Border.all(
                        color: statusColor.withValues(alpha: 0.3),
                        width: 0.8,
                      ),
                    ),
                    child: Text(
                      statusLabel,
                      style: TextStyle(
                        color: statusColor,
                        fontSize: 8.5,
                        fontWeight: FontWeight.w800,
                        letterSpacing: 0.6,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        );
      },
    );
  }
}

class _ClinicalRingPainter extends CustomPainter {
  final double progress;
  final Color accentColor;

  _ClinicalRingPainter({
    required this.progress,
    required this.accentColor,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final strokeWidth = size.width * 0.085;
    final radius = (size.width - strokeWidth) / 2;

    // 1. Subtle Background Track Ring
    final trackPaint = Paint()
      ..color = const Color(0xFFE2E8F0)
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;

    canvas.drawCircle(center, radius, trackPaint);

    if (progress <= 0) return;

    // 2. Smooth Continuous Clinical Arc
    final sweepAngle = 2 * pi * progress;

    final arcPaint = Paint()
      ..shader = SweepGradient(
        colors: [
          const Color(0xFF0066FF),
          accentColor,
        ],
        startAngle: 0,
        endAngle: sweepAngle,
        transform: const GradientRotation(-pi / 2),
      ).createShader(Rect.fromCircle(center: center, radius: radius))
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;

    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      -pi / 2,
      sweepAngle,
      false,
      arcPaint,
    );

    // 3. Crisp Medical Lead Dot
    final leadAngle = -pi / 2 + sweepAngle;
    final dotCenter = Offset(
      center.dx + radius * cos(leadAngle),
      center.dy + radius * sin(leadAngle),
    );

    final dotPaint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.fill;
    canvas.drawCircle(dotCenter, strokeWidth * 0.35, dotPaint);
  }

  @override
  bool shouldRepaint(covariant _ClinicalRingPainter oldDelegate) {
    return oldDelegate.progress != progress || oldDelegate.accentColor != accentColor;
  }
}
