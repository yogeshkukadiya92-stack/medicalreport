class TrendPoint {
  final String date;
  final double value;
  final String valueLabel;
  final String status;

  TrendPoint({
    required this.date,
    required this.value,
    required this.valueLabel,
    required this.status,
  });
}

class BiomarkerTrend {
  final String name;
  final List<TrendPoint> points;

  BiomarkerTrend({
    required this.name,
    required this.points,
  });

  TrendPoint get latest => points.last;
  TrendPoint? get previous => points.length > 1 ? points[points.length - 2] : null;

  double? get delta => previous != null ? latest.value - previous!.value : null;
  double get minValue => points.map((p) => p.value).reduce((a, b) => a < b ? a : b);
  double get maxValue => points.map((p) => p.value).reduce((a, b) => a > b ? a : b);
}
