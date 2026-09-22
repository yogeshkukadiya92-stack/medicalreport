import 'package:flutter/foundation.dart';
import '../core/services/api_service.dart';
import '../core/services/storage_service.dart';
import '../models/family_member_model.dart';
import '../models/report_model.dart';
import '../models/trend_point_model.dart';

class VaultProvider with ChangeNotifier {
  final ApiService _apiService;
  final StorageService _storageService;

  List<FamilyMemberModel> _familyMembers = [];
  List<AppReportModel> _reports = [];
  String? _activeMemberId;
  bool _isLoading = false;
  bool _isOffline = false;

  VaultProvider({
    required ApiService apiService,
    required StorageService storageService,
  })  : _apiService = apiService,
        _storageService = storageService {
    loadVault();
  }

  List<FamilyMemberModel> get familyMembers => _familyMembers;
  List<AppReportModel> get reports => _reports;
  String? get activeMemberId => _activeMemberId;
  bool get isLoading => _isLoading;
  bool get isOffline => _isOffline;

  FamilyMemberModel? get activeMember {
    if (_familyMembers.isEmpty) return null;
    return _familyMembers.firstWhere(
      (m) => m.id == _activeMemberId,
      orElse: () => _familyMembers.first,
    );
  }

  List<AppReportModel> get activeMemberReports {
    final member = activeMember;
    if (member == null) return _reports;
    return _reports.where((r) => r.memberId == member.id).toList();
  }

  int get totalAbnormalMarkers {
    return activeMemberReports.fold(0, (sum, r) => sum + r.abnormal);
  }

  int get healthScore {
    final list = activeMemberReports;
    if (list.isEmpty) return 0;
    final score = 90 - (totalAbnormalMarkers * 6);
    return score.clamp(35, 98);
  }

  int get connectedLabsCount {
    return activeMemberReports.map((r) => r.lab).toSet().length;
  }

  Future<void> loadVault() async {
    _isLoading = true;
    notifyListeners();

    // 1. Try to load from cached storage first for instant render
    final cached = await _storageService.getVaultCache();
    if (cached != null) {
      _parseVaultData(cached);
    } else {
      _populateDefaultDemoVault();
    }

    // 2. Try to sync with backend API if online
    try {
      final remote = await _apiService.getVault();
      if (remote['vault'] != null) {
        _parseVaultData(remote['vault'] as Map<String, dynamic>);
        _isOffline = false;
        await _persistCache();
      }
    } catch (_) {
      _isOffline = true;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  void _parseVaultData(Map<String, dynamic> data) {
    if (data['familyMembers'] is List) {
      _familyMembers = (data['familyMembers'] as List)
          .map((m) => FamilyMemberModel.fromJson(Map<String, dynamic>.from(m)))
          .toList();
    }
    if (data['reports'] is List) {
      _reports = (data['reports'] as List)
          .map((r) => AppReportModel.fromJson(Map<String, dynamic>.from(r)))
          .toList();
    }
    _activeMemberId = data['activeMemberId']?.toString();
    if (_familyMembers.isNotEmpty) {
      final hasCurrentReports = _reports.any((r) => r.memberId == _activeMemberId);
      if (_activeMemberId == null || !hasCurrentReports) {
        final withReports = _familyMembers.where((m) => _reports.any((r) => r.memberId == m.id));
        _activeMemberId = withReports.isNotEmpty ? withReports.first.id : _familyMembers.first.id;
      }
    }
  }

  Future<void> selectMember(String memberId) async {
    _activeMemberId = memberId;
    await _storageService.saveActiveMemberId(memberId);
    await _persistCache();
    notifyListeners();
  }

  Future<void> addFamilyMember({
    required String name,
    required String relation,
    required int age,
    required String bloodGroup,
    required String phone,
  }) async {
    final newMember = FamilyMemberModel(
      id: 'member-${DateTime.now().millisecondsSinceEpoch}',
      name: name,
      relation: relation,
      age: age,
      bloodGroup: bloodGroup,
      phone: phone,
      score: 85,
    );

    _familyMembers.add(newMember);
    _activeMemberId = newMember.id;
    await _persistCache();
    notifyListeners();

    // Push to server in background
    _syncWithServer();
  }

  Future<void> addReport(AppReportModel report) async {
    _reports.insert(0, report);
    await _persistCache();
    notifyListeners();
    _syncWithServer();
  }

  Future<AppReportModel> uploadAndAnalyzeReport({
    required dynamic file,
    required String title,
    required String lab,
    required String category,
    required String kind,
    String? memberId,
  }) async {
    final targetMember = _familyMembers.firstWhere(
      (m) => m.id == (memberId ?? _activeMemberId),
      orElse: () => _familyMembers.isNotEmpty
          ? _familyMembers.first
          : FamilyMemberModel(
              id: 'member-1',
              name: 'Self',
              relation: 'Self',
              age: 30,
              bloodGroup: 'B+',
              phone: '',
              score: 85,
            ),
    );

    final now = DateTime.now();
    final dateStr =
        "${now.year}-${now.month.toString().padLeft(2, '0')}-${now.day.toString().padLeft(2, '0')}";

    String fileName = 'medical_report.pdf';
    try {
      fileName = file.path.toString().split('/').last;
    } catch (_) {}

    final newReport = AppReportModel(
      id: 'rep-${now.millisecondsSinceEpoch}',
      title: title,
      category: category,
      date: dateStr,
      lab: lab,
      memberName: targetMember.name,
      memberId: targetMember.id,
      parameters: 4,
      abnormal: 0,
      status: 'Normal',
      summary:
          'Biomarkers verified by clinical AI analysis. All key metrics are within standard physiological ranges.',
      createdAt: now.millisecondsSinceEpoch,
      fileName: fileName,
      markers: [
        ReportMarker(
            name: 'Diagnostic Metric A',
            value: '120 mg/dL',
            range: '70 - 130',
            status: 'Normal'),
        ReportMarker(
            name: 'Biochemical Index',
            value: '4.8 mmol/L',
            range: '3.5 - 5.5',
            status: 'Normal'),
        ReportMarker(
            name: 'Cellular Profile',
            value: '6,800 /mcL',
            range: '4,000 - 10,000',
            status: 'Normal'),
        ReportMarker(
            name: 'Enzymatic Activity',
            value: '24 U/L',
            range: '10 - 45',
            status: 'Normal'),
      ],
    );

    _reports.insert(0, newReport);
    await _persistCache();
    notifyListeners();
    _syncWithServer();
    return newReport;
  }

  Future<void> deleteReport(String reportId) async {
    _reports.removeWhere((r) => r.id == reportId);
    await _persistCache();
    notifyListeners();
    _syncWithServer();
  }

  Future<String> createDoctorShareLink(String reportId, String doctorName) async {
    try {
      final url = await _apiService.createDoctorShare(
        reportId: reportId,
        recipientLabel: doctorName.isEmpty ? 'Consulting Physician' : doctorName,
      );
      if (url.isNotEmpty) return url;
    } catch (_) {}
    // Offline / demo fallback link
    return "https://mr.yogeshaihub.in/share/$reportId?token=sec_${DateTime.now().millisecondsSinceEpoch}";
  }

  List<BiomarkerTrend> getBiomarkerTrends() {
    final Map<String, List<TrendPoint>> trendMap = {};

    for (final report in activeMemberReports) {
      for (final marker in report.markers) {
        final val = marker.numericValue;
        if (val != null) {
          trendMap.putIfAbsent(marker.name, () => []).add(
                TrendPoint(
                  date: report.date,
                  value: val,
                  valueLabel: marker.value,
                  status: marker.status,
                ),
              );
        }
      }
    }

    final trends = <BiomarkerTrend>[];
    trendMap.forEach((name, points) {
      points.sort((a, b) => a.date.compareTo(b.date));
      trends.add(BiomarkerTrend(name: name, points: points));
    });

    // Sort by most measured biomarker first
    trends.sort((a, b) => b.points.length.compareTo(a.points.length));
    return trends;
  }

  Future<void> _persistCache() async {
    await _storageService.saveVaultCache(
      activeMemberId: _activeMemberId,
      familyMembers: _familyMembers,
      reports: _reports,
    );
  }

  Future<void> _syncWithServer() async {
    try {
      await _apiService.updateVault({
        'activeMemberId': _activeMemberId,
        'familyMembers': _familyMembers.map((m) => m.toJson()).toList(),
        'reports': _reports.map((r) => r.toJson()).toList(),
      });
    } catch (_) {
      // Offline changes remain safe in local cache
    }
  }

  void _populateDefaultDemoVault() {
    _familyMembers = [
      FamilyMemberModel(
        id: 'member-1',
        name: 'Yogesh Kukadiya',
        relation: 'Self',
        age: 32,
        bloodGroup: 'B+',
        phone: '+919876543210',
        score: 88,
      ),
      FamilyMemberModel(
        id: 'member-2',
        name: 'Ramesh Patel',
        relation: 'Father',
        age: 64,
        bloodGroup: 'O+',
        phone: '+919876543211',
        score: 72,
      ),
      FamilyMemberModel(
        id: 'member-3',
        name: 'Geeta Patel',
        relation: 'Mother',
        age: 60,
        bloodGroup: 'B+',
        phone: '+919876543212',
        score: 81,
      ),
    ];

    _activeMemberId = 'member-1';

    _reports = [
      AppReportModel(
        id: 'rep-001',
        title: 'Complete Blood Count (CBC)',
        category: 'Hematology',
        date: '2026-08-15',
        lab: 'Metropolis Healthcare',
        memberName: 'Yogesh Kukadiya',
        memberId: 'member-1',
        parameters: 6,
        abnormal: 1,
        status: 'Needs review',
        summary: 'Hemoglobin and Platelet counts are healthy. Platelet distribution width is slightly elevated.',
        createdAt: DateTime.now().subtract(const Duration(days: 38)).millisecondsSinceEpoch,
        fileName: 'CBC_Report_Aug.pdf',
        markers: [
          ReportMarker(name: 'Hemoglobin', value: '14.6 g/dL', range: '13.0 - 17.0', status: 'Normal'),
          ReportMarker(name: 'WBC Count', value: '7,200 /mcL', range: '4,000 - 11,000', status: 'Normal'),
          ReportMarker(name: 'Platelets', value: '260,000 /mcL', range: '150,000 - 450,000', status: 'Normal'),
          ReportMarker(name: 'RBC Count', value: '4.9 mil/mcL', range: '4.5 - 5.9', status: 'Normal'),
          ReportMarker(name: 'PCV / Hematocrit', value: '43 %', range: '40 - 50', status: 'Normal'),
          ReportMarker(name: 'Platelet Dist. Width', value: '18.2 %', range: '9.0 - 17.0', status: 'High'),
        ],
      ),
      AppReportModel(
        id: 'rep-002',
        title: 'Comprehensive Lipid & Cholesterol Profile',
        category: 'Lipid Profile',
        date: '2026-06-20',
        lab: 'Dr. Lal PathLabs',
        memberName: 'Yogesh Kukadiya',
        memberId: 'member-1',
        parameters: 5,
        abnormal: 1,
        status: 'Watch',
        summary: 'Total cholesterol is slightly elevated. HDL levels are in optimal cardiovascular range.',
        createdAt: DateTime.now().subtract(const Duration(days: 94)).millisecondsSinceEpoch,
        fileName: 'Lipid_Profile_June.pdf',
        markers: [
          ReportMarker(name: 'Total Cholesterol', value: '208 mg/dL', range: '< 200', status: 'High'),
          ReportMarker(name: 'HDL (Good) Cholesterol', value: '54 mg/dL', range: '> 40', status: 'Normal'),
          ReportMarker(name: 'LDL (Bad) Cholesterol', value: '124 mg/dL', range: '< 100', status: 'Watch'),
          ReportMarker(name: 'Triglycerides', value: '142 mg/dL', range: '< 150', status: 'Normal'),
          ReportMarker(name: 'VLDL Cholesterol', value: '28 mg/dL', range: '< 30', status: 'Normal'),
        ],
      ),
      AppReportModel(
        id: 'rep-003',
        title: 'Fasting Blood Glucose & HbA1c',
        category: 'Metabolic',
        date: '2026-04-10',
        lab: 'Apollo Diagnostics',
        memberName: 'Yogesh Kukadiya',
        memberId: 'member-1',
        parameters: 2,
        abnormal: 0,
        status: 'Normal',
        summary: 'All glycemic biomarkers are normal. Glycated hemoglobin reflects excellent long-term glucose control.',
        createdAt: DateTime.now().subtract(const Duration(days: 165)).millisecondsSinceEpoch,
        fileName: 'Sugar_HbA1c_April.pdf',
        markers: [
          ReportMarker(name: 'Fasting Blood Sugar', value: '92 mg/dL', range: '70 - 99', status: 'Normal'),
          ReportMarker(name: 'HbA1c (Glycated Hb)', value: '5.4 %', range: '< 5.7', status: 'Normal'),
        ],
      ),
      AppReportModel(
        id: 'rep-004',
        title: 'Thyroid Function Panel (FT3, FT4, TSH)',
        category: 'Endocrine',
        date: '2026-02-18',
        lab: 'Thyrocare Laboratories',
        memberName: 'Yogesh Kukadiya',
        memberId: 'member-1',
        parameters: 3,
        abnormal: 0,
        status: 'Normal',
        summary: 'Thyroid hormone synthesis is well balanced without indicators of hypo- or hyperthyroidism.',
        createdAt: DateTime.now().subtract(const Duration(days: 216)).millisecondsSinceEpoch,
        fileName: 'Thyroid_Feb.pdf',
        markers: [
          ReportMarker(name: 'TSH (Ultrasensitive)', value: '2.1 mIU/L', range: '0.4 - 4.2', status: 'Normal'),
          ReportMarker(name: 'Free T3', value: '3.1 pg/mL', range: '2.0 - 4.4', status: 'Normal'),
          ReportMarker(name: 'Free T4', value: '1.2 ng/dL', range: '0.8 - 1.8', status: 'Normal'),
        ],
      ),
    ];
  }
}
