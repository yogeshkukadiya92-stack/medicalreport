import 'package:flutter/material.dart';

/// Ultra-Luxury 3D Matrix Perspective Tilt Card.
/// Responds to finger drag/touch with perspective rotation [rotateX, rotateY],
/// and springs back smoothly on release.
class TiltCard extends StatefulWidget {
  final Widget child;
  final double maxTilt;
  final BorderRadius? borderRadius;
  final EdgeInsetsGeometry? padding;
  final VoidCallback? onTap;

  const TiltCard({
    super.key,
    required this.child,
    this.maxTilt = 0.12,
    this.borderRadius,
    this.padding,
    this.onTap,
  });

  @override
  State<TiltCard> createState() => _TiltCardState();
}

class _TiltCardState extends State<TiltCard> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _rotXAnimation;
  late Animation<double> _rotYAnimation;

  double _rotX = 0;
  double _rotY = 0;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 400),
    );

    _rotXAnimation = Tween<double>(begin: 0, end: 0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOutBack),
    );
    _rotYAnimation = Tween<double>(begin: 0, end: 0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOutBack),
    );

    _controller.addListener(() {
      setState(() {
        _rotX = _rotXAnimation.value;
        _rotY = _rotYAnimation.value;
      });
    });
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _onPanUpdate(DragUpdateDetails details, Size size) {
    _controller.stop();
    final local = details.localPosition;
    final centerX = size.width / 2;
    final centerY = size.height / 2;

    final dx = (local.dx - centerX) / centerX;
    final dy = (local.dy - centerY) / centerY;

    setState(() {
      _rotY = (dx * widget.maxTilt).clamp(-widget.maxTilt, widget.maxTilt);
      _rotX = (-dy * widget.maxTilt).clamp(-widget.maxTilt, widget.maxTilt);
    });
  }

  void _onPanEnd(DragEndDetails details) {
    _rotXAnimation = Tween<double>(begin: _rotX, end: 0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOutBack),
    );
    _rotYAnimation = Tween<double>(begin: _rotY, end: 0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOutBack),
    );
    _controller.forward(from: 0);
  }

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final size = Size(constraints.maxWidth, constraints.maxHeight);
        return GestureDetector(
          onTap: widget.onTap,
          onPanUpdate: (details) => _onPanUpdate(details, size),
          onPanEnd: _onPanEnd,
          onPanCancel: () => _onPanEnd(DragEndDetails()),
          child: Transform(
            alignment: FractionalOffset.center,
            transform: Matrix4.identity()
              ..setEntry(3, 2, 0.0015) // perspective depth
              ..rotateX(_rotX)
              ..rotateY(_rotY),
            child: widget.child,
          ),
        );
      },
    );
  }
}
