import 'dart:ui';
import 'package:flutter/material.dart';
import '../core/constants/app_colors.dart';

/// Clinical Executive 3D Interactive Card (Apple / Linear Standard)
/// Provides subtle spatial depth and tactile feedback while maintaining clean clinical clarity.
class Luxury3DCard extends StatefulWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;
  final double borderRadius;
  final VoidCallback? onTap;
  final bool enableSpecular;

  const Luxury3DCard({
    super.key,
    required this.child,
    this.padding,
    this.margin,
    this.borderRadius = 20.0,
    this.onTap,
    this.enableSpecular = true,
  });

  @override
  State<Luxury3DCard> createState() => _Luxury3DCardState();
}

class _Luxury3DCardState extends State<Luxury3DCard> with SingleTickerProviderStateMixin {
  late AnimationController _springController;
  late Animation<double> _rotXAnim;
  late Animation<double> _rotYAnim;

  double _rotX = 0.0;
  double _rotY = 0.0;
  Offset _touchPos = const Offset(0.5, 0.5);
  bool _isInteracting = false;

  @override
  void initState() {
    super.initState();
    _springController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 450),
    );
  }

  @override
  void dispose() {
    _springController.dispose();
    super.dispose();
  }

  void _onPanUpdate(DragUpdateDetails details, Size size) {
    _springController.stop();
    final local = details.localPosition;
    final normX = (local.dx / size.width).clamp(0.0, 1.0);
    final normY = (local.dy / size.height).clamp(0.0, 1.0);

    setState(() {
      _isInteracting = true;
      _touchPos = Offset(normX, normY);
      _rotY = ((normX - 0.5) * 0.16);
      _rotX = (-(normY - 0.5) * 0.16);
    });
  }

  void _onPanEnd(DragEndDetails details) {
    final curX = _rotX;
    final curY = _rotY;
    _rotXAnim = Tween<double>(begin: curX, end: 0.0).animate(
      CurvedAnimation(parent: _springController, curve: Curves.easeOutBack),
    );
    _rotYAnim = Tween<double>(begin: curY, end: 0.0).animate(
      CurvedAnimation(parent: _springController, curve: Curves.easeOutBack),
    );

    _springController.addListener(() {
      setState(() {
        _rotX = _rotXAnim.value;
        _rotY = _rotYAnim.value;
      });
    });

    _springController.forward(from: 0).then((_) {
      if (mounted) setState(() => _isInteracting = false);
    });
  }

  @override
  Widget build(BuildContext context) {
    final radius = BorderRadius.circular(widget.borderRadius);

    return LayoutBuilder(
      builder: (context, constraints) {
        final size = Size(constraints.maxWidth, 200);

        return Container(
          margin: widget.margin,
          child: GestureDetector(
            onTap: widget.onTap,
            onPanUpdate: (d) => _onPanUpdate(d, size),
            onPanEnd: _onPanEnd,
            onPanCancel: () => _onPanEnd(DragEndDetails()),
            child: Transform(
              alignment: FractionalOffset.center,
              transform: Matrix4.identity()
                ..setEntry(3, 2, 0.0015)
                ..rotateX(_rotX)
                ..rotateY(_rotY),
              child: Container(
                decoration: BoxDecoration(
                  borderRadius: radius,
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF0F172A).withValues(alpha: _isInteracting ? 0.08 : 0.04),
                      blurRadius: _isInteracting ? 24 : 14,
                      spreadRadius: 0,
                      offset: const Offset(0, 5),
                    ),
                  ],
                ),
                child: ClipRRect(
                  borderRadius: radius,
                  child: Container(
                    padding: widget.padding ?? const EdgeInsets.all(18),
                    decoration: BoxDecoration(
                      borderRadius: radius,
                      color: Colors.white,
                      border: Border.all(
                        color: _isInteracting
                            ? AppColors.primary.withValues(alpha: 0.4)
                            : AppColors.strokeLight,
                        width: 1.0,
                      ),
                    ),
                    child: Stack(
                      children: [
                        // Soft Specular Sheen Following Touch
                        if (widget.enableSpecular && _isInteracting)
                          Positioned.fill(
                            child: ClipRRect(
                              borderRadius: radius,
                              child: Container(
                                decoration: BoxDecoration(
                                  gradient: RadialGradient(
                                    center: Alignment(
                                      _touchPos.dx * 2 - 1,
                                      _touchPos.dy * 2 - 1,
                                    ),
                                    radius: 0.9,
                                    colors: [
                                      AppColors.primary.withValues(alpha: 0.06),
                                      Colors.transparent,
                                    ],
                                    stops: const [0.0, 1.0],
                                  ),
                                ),
                              ),
                            ),
                          ),
                        widget.child,
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}
