class FamilyMemberModel {
  final String id;
  final String name;
  final String relation;
  final int age;
  final String bloodGroup;
  final String? phone;
  final int score;

  FamilyMemberModel({
    required this.id,
    required this.name,
    required this.relation,
    required this.age,
    required this.bloodGroup,
    this.phone,
    this.score = 0,
  });

  factory FamilyMemberModel.fromJson(Map<String, dynamic> json) {
    return FamilyMemberModel(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? 'Unknown',
      relation: json['relation']?.toString() ?? 'Self',
      age: int.tryParse(json['age']?.toString() ?? '0') ?? 0,
      bloodGroup: json['bloodGroup']?.toString() ?? 'Unknown',
      phone: json['phone']?.toString(),
      score: int.tryParse(json['score']?.toString() ?? '0') ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'relation': relation,
      'age': age,
      'bloodGroup': bloodGroup,
      'phone': phone,
      'score': score,
    };
  }

  String get initials {
    final parts = name.trim().split(RegExp(r'\s+'));
    if (parts.isEmpty || parts[0].isEmpty) return 'U';
    if (parts.length == 1) return parts[0][0].toUpperCase();
    return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
  }
}
