class ReportMarker {
  final String name;
  final String range;
  final String status; // "Normal", "High", "Low", "Watch"
  final String value;

  ReportMarker({
    required this.name,
    required this.range,
    required this.status,
    required this.value,
  });

  factory ReportMarker.fromJson(Map<String, dynamic> json) {
    return ReportMarker(
      name: json['name']?.toString() ?? '',
      range: json['range']?.toString() ?? '',
      status: json['status']?.toString() ?? 'Normal',
      value: json['value']?.toString() ?? '',
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'range': range,
      'status': status,
      'value': value,
    };
  }

  double? get numericValue {
    final clean = value.replaceAll(',', '');
    final match = RegExp(r'-?\d+(\.\d+)?').firstMatch(clean);
    return match != null ? double.tryParse(match.group(0)!) : null;
  }
}

class AppReportModel {
  final String id;
  final String title;
  final String category;
  final String date;
  final String lab;
  final String memberName;
  final String memberId;
  final int parameters;
  final int abnormal;
  final String status;
  final String summary;
  final List<ReportMarker> markers;
  final String fileName;
  final String? fileId;
  final String? fileMimeType;
  final String? source;
  final bool starred;
  final int createdAt;

  AppReportModel({
    required this.id,
    required this.title,
    required this.category,
    required this.date,
    required this.lab,
    required this.memberName,
    required this.memberId,
    required this.parameters,
    required this.abnormal,
    required this.status,
    required this.summary,
    required this.markers,
    required this.fileName,
    this.fileId,
    this.fileMimeType,
    this.source = 'self_upload',
    this.starred = false,
    required this.createdAt,
  });

  factory AppReportModel.fromJson(Map<String, dynamic> json) {
    var rawMarkers = json['markers'];
    List<ReportMarker> markerList = [];
    if (rawMarkers is List) {
      markerList = rawMarkers
          .map((m) => ReportMarker.fromJson(Map<String, dynamic>.from(m)))
          .toList();
    }

    return AppReportModel(
      id: json['id']?.toString() ?? 'report-${DateTime.now().millisecondsSinceEpoch}',
      title: json['title']?.toString() ?? 'Medical Report',
      category: json['category']?.toString() ?? 'General',
      date: json['date']?.toString() ?? DateTime.now().toIso8601String().substring(0, 10),
      lab: json['lab']?.toString() ?? 'Diagnostic Lab',
      memberName: json['memberName']?.toString() ?? 'Patient',
      memberId: json['memberId']?.toString() ?? '',
      parameters: int.tryParse(json['parameters']?.toString() ?? '0') ?? markerList.length,
      abnormal: int.tryParse(json['abnormal']?.toString() ?? '0') ??
          markerList.where((m) => m.status != 'Normal').length,
      status: json['status']?.toString() ?? 'Normal',
      summary: json['summary']?.toString() ?? '',
      markers: markerList,
      fileName: json['fileName']?.toString() ?? 'report.pdf',
      fileId: json['fileId']?.toString(),
      fileMimeType: json['fileMimeType']?.toString(),
      source: json['source']?.toString() ?? 'self_upload',
      starred: json['starred'] == true,
      createdAt: int.tryParse(json['createdAt']?.toString() ?? '0') ??
          DateTime.now().millisecondsSinceEpoch,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'category': category,
      'date': date,
      'lab': lab,
      'memberName': memberName,
      'memberId': memberId,
      'parameters': parameters,
      'abnormal': abnormal,
      'status': status,
      'summary': summary,
      'markers': markers.map((m) => m.toJson()).toList(),
      'fileName': fileName,
      'fileId': fileId,
      'fileMimeType': fileMimeType,
      'source': source,
      'starred': starred,
      'createdAt': createdAt,
    };
  }
}
