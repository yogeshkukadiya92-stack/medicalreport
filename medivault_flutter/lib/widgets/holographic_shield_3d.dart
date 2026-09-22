import 'dart:math';
import 'package:flutter/material.dart';
import '../core/constants/app_colors.dart';

class HolographicShield3D extends StatefulWidget {
  final double size;

  const HolographicShield3D({
    super.key,
    this.size = 140.0,
  });

  @override
  State<HolographicShield3D> createState() => _HolographicShield3DState();
}

class _HolographicShield3DState extends State<HolographicShield3D> with TickerProviderStateMixin {
  late AnimationController _rotationController;
  late AnimationController _pulseController;
  late AnimationController _tiltSpringController;

  double _dragPitch = 0.0;
  double _dragRoll = 0.0;

  @override
  void initState() {
    super.initState();
    // Continuous orbital rotation
    _rotationController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 12),
    )..repeat();

    // Pulse wave breathing animation
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 2400),
    )..repeat(reverse: true);

    // Physics spring controller
    _tiltSpringController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 500),
    );
  }

  @override
  void dispose() {
    _rotationController.dispose();
    _pulseController.dispose();
    _tiltSpringController.dispose();
    super.dispose();
  }

  void _onPanUpdate(DragUpdateDetails details) {
    setState(() {
      _dragPitch = (_dragPitch - details.delta.dy * 0.008).clamp(-0.4, 0.4);
      _dragRoll = (_dragRoll + details.delta.dx * 0.008).clamp(-0.4, 0.4);
    });
  }

  void _onPanEnd(DragEndDetails details) {
    final startPitch = _dragPitch;
    final startRoll = _dragRoll;
    final animation = CurvedAnimation(
      parent: _tiltSpringController,
      curve: Curves.easeOutBack,
    );

    _tiltSpringController.addListener(() {
      setState(() {
        _dragPitch = startPitch * (1 - animation.value);
        _dragRoll = startRoll * (1 - animation.value);
      });
    });

    _tiltSpringController.forward(from: 0);
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onPanUpdate: _onPanUpdate,
      onPanEnd: _onPanEnd,
      child: AnimatedBuilder(
        animation: Listenable.merge([_rotationController, _pulseController]),
        builder: (context, child) {
          final rotationAngle = _rotationController.value * 2 * pi;
          final pulse = _pulseController.value;

          return SizedBox(
            width: widget.size,
            height: widget.size,
            child: Stack(
              alignment: Alignment.center,
              children: [
                // Background Ambient Glow Aura
                Container(
                  width: widget.size * 0.9,
                  height: widget.size * 0.9,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.neonMint.withValues(alpha: 0.35 + (pulse * 0.15)),
                        blurRadius: 40 + (pulse * 20),
                        spreadRadius: 4 + (pulse * 8),
                      ),
                      BoxShadow(
                        color: AppColors.neonTeal.withValues(alpha: 0.25),
                        blurRadius: 50,
                        spreadRadius: 2,
                      ),
                    ],
                  ),
                ),

                // 3D Matrix Perspective Transformed Holographic Rings
                Transform(
                  alignment: FractionalOffset.center,
                  transform: Matrix4.identity()
                    ..setEntry(3, 2, 0.002) // 3D perspective
                    ..rotateX(_dragPitch + sin(rotationAngle * 0.5) * 0.08)
                    ..rotateY(_dragRoll + cos(rotationAngle * 0.5) * 0.08),
                  child: CustomPaint(
                    size: Size(widget.size, widget.size),
                    painter: _HoloPainter(
                      rotation: rotationAngle,
                      pulse: pulse,
                    ),
                  ),
                ),

                // Floating 3D Core Shield with Specular Highlight
                Transform(
                  alignment: FractionalOffset.center,
                  transform: Matrix4.identity()
                    ..setEntry(3, 2, 0.0025)
                    ..translate(0.0, 0.0, 30.0) // Z depth
                    ..rotateX(_dragPitch * 1.2)
                    ..rotateY(_dragRoll * 1.2),
                  child: Container(
                    width: widget.size * 0.44,
                    height: widget.size * 0.44,
                    decoration: BoxDecoration(
                      gradient: const RadialGradient(
                        colors: [
                          Color(0xFF0D2E26),
                          Color(0xFF061814),
                        ],
                        center: Alignment(-0.2, -0.3),
                      ),
                      borderRadius: BorderRadius.circular(22),
                      border: Border.all(
                        color: AppColors.neonMint.withValues(alpha: 0.8),
                        width: 1.8,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.neonMint.withValues(alpha: 0.5),
                          blurRadius: 20,
                          spreadRadius: 1,
                        ),
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.8),
                          blurRadius: 14,
                          offset: const Offset(0, 8),
                        ),
                      ],
                    ),
                    child: Center(
                      child: ShaderMask(
                        shaderCallback: (bounds) => const LinearGradient(
                          colors: [Colors.white, AppColors.neonMint],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ).createShader(bounds),
                        child: Icon(
                          Icons.shield_rounded,
                          size: widget.size * 0.24,
                          color: Colors.white,
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _HoloPainter extends CustomPainter {
  final double rotation;
  final double pulse;

  _HoloPainter({required this.rotation, required this.pulse});

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final maxRadius = size.width * 0.46;

    // 1. Outer Orbiting Ring with dashed gaps
    final outerRingPaint = Paint()
      ..color = AppColors.neonMint.withValues(alpha: 0.35)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.4;

    canvas.drawCircle(center, maxRadius, outerRingPaint);

    // 2. Rotating Arc Chunks
    final arcPaint = Paint()
      ..shader = SweepGradient(
        colors: const [
          AppColors.neonMint,
          Colors.transparent,
          AppColors.neonTeal,
          Colors.transparent,
        ],
        transform: GradientRotation(rotation),
      ).createShader(Rect.fromCircle(center: center, radius: maxRadius))
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.4
      ..strokeCap = StrokeCap.round;

    canvas.drawArc(
      Rect.fromCircle(center: center, radius: maxRadius),
      rotation,
      pi * 0.7,
      false,
      arcPaint,
    );

    canvas.drawArc(
      Rect.fromCircle(center: center, radius: maxRadius),
      rotation + pi,
      pi * 0.7,
      false,
      arcPaint,
    );

    // 3. Middle Secondary Gyro Ellipse
    canvas.save();
    canvas.translate(center.dx, center.dy);
    canvas.rotate(-rotation * 0.8);

    final midEllipsePaint = Paint()
      ..color = AppColors.neonTeal.withValues(alpha: 0.45)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.2;

    canvas.drawOval(
      Rect.fromCenter(
        center: Offset.zero,
        width: maxRadius * 1.6,
        height: maxRadius * 0.9 + (pulse * 8),
      ),
      midEllipsePaint,
    );

    // 4. Orbiting Particle Satellites
    final particlePaint = Paint()
      ..color = Colors.white
      ..style = PaintingStyle.fill;

    final satX = (maxRadius * 0.8) * cos(rotation * 1.5);
    final satY = (maxRadius * 0.45) * sin(rotation * 1.5);
    canvas.drawCircle(Offset(satX, satY), 3.2, particlePaint);

    final glowParticle = Paint()
      ..color = AppColors.neonMint.withValues(alpha: 0.9)
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 5);
    canvas.drawCircle(Offset(satX, satY), 5.5, glowParticle);

    canvas.restore();

    // 5. Digital Tick Marks
    final tickPaint = Paint()
      ..color = AppColors.neonMint.withValues(alpha: 0.25)
      ..strokeWidth = 1.0;

    const tickCount = 24;
    for (int i = 0; i < tickCount; i++) {
      final angle = (i * 2 * pi / tickCount) + (rotation * 0.2);
      final r1 = maxRadius - 5;
      final r2 = maxRadius + (i % 6 == 0 ? 4 : 0);
      canvas.drawLine(
        Offset(center.dx + r1 * cos(angle), center.dy + r1 * sin(angle)),
        Offset(center.dx + r2 * cos(angle), center.dy + r2 * sin(angle)),
        tickPaint,
      );
    }
  }

  @override
  bool shouldRepaint(covariant _HoloPainter oldDelegate) {
    return oldDelegate.rotation != rotation || oldDelegate.pulse != pulse;
  }
}
