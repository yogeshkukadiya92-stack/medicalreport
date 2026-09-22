import 'dart:ui';
import 'package:flutter/material.dart';

class GlassContainer extends StatelessWidget {
  final Widget child;
  final double blur;
  final double opacity;
  final Color? color;
  final BorderRadius? borderRadius;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;
  final Border? border;
  final Gradient? gradient;

  const GlassContainer({
    super.key,
    required this.child,
    this.blur = 16.0,
    this.opacity = 0.08,
    this.color,
    this.borderRadius,
    this.padding,
    this.margin,
    this.border,
    this.gradient,
  });

  @override
  Widget build(BuildContext context) {
    final effectiveRadius = borderRadius ?? BorderRadius.circular(16);

    return Container(
      margin: margin,
      decoration: BoxDecoration(
        borderRadius: effectiveRadius,
        boxShadow: [
          BoxShadow(
            color: (color ?? Colors.black).withValues(alpha: 0.04),
            blurRadius: 20,
            spreadRadius: 2,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: effectiveRadius,
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: blur, sigmaY: blur),
          child: Container(
            padding: padding ?? const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: gradient == null
                  ? (color ?? Colors.white).withValues(alpha: opacity)
                  : null,
              gradient: gradient,
              borderRadius: effectiveRadius,
              border: border ??
                  Border.all(
                    color: Colors.white.withValues(alpha: 0.2),
                    width: 1,
                  ),
            ),
            child: child,
          ),
        ),
      ),
    );
  }
}
