class IdentifyRecord {
  final int id;
  final String imageUrl;
  final String jadeType;
  final String lightMode;
  final bool? isAuthentic;
  final double? confidence;
  final String? features;
  final String? suggestion;
  final String status;
  final DateTime createdAt;

  IdentifyRecord({
    required this.id,
    required this.imageUrl,
    required this.jadeType,
    required this.lightMode,
    this.isAuthentic,
    this.confidence,
    this.features,
    this.suggestion,
    required this.status,
    required this.createdAt,
  });

  factory IdentifyRecord.fromJson(Map<String, dynamic> json) {
    return IdentifyRecord(
      id: json['id'],
      imageUrl: json['image_url'],
      jadeType: json['jade_type'],
      lightMode: json['light_mode'],
      isAuthentic: json['is_authentic'],
      confidence: json['confidence']?.toDouble(),
      features: json['features'],
      suggestion: json['suggestion'],
      status: json['status'],
      createdAt: DateTime.parse(json['created_at']),
    );
  }
}
