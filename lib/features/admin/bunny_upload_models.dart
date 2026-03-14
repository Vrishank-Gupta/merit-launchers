class BunnyUploadTicket {
  const BunnyUploadTicket({
    required this.videoId,
    required this.libraryId,
    required this.expirationTime,
    required this.signature,
    required this.title,
    required this.hlsUrl,
    required this.directPlayUrl,
  });

  final String videoId;
  final String libraryId;
  final int expirationTime;
  final String signature;
  final String title;
  final String hlsUrl;
  final String directPlayUrl;

  Map<String, dynamic> toJson() {
    return {
      'videoId': videoId,
      'libraryId': libraryId,
      'expirationTime': expirationTime,
      'signature': signature,
      'title': title,
      'hlsUrl': hlsUrl,
      'directPlayUrl': directPlayUrl,
    };
  }

  factory BunnyUploadTicket.fromJson(Map<String, dynamic> json) {
    return BunnyUploadTicket(
      videoId: json['videoId'] as String? ?? '',
      libraryId: json['libraryId'] as String? ?? '',
      expirationTime: (json['expirationTime'] as num?)?.toInt() ?? 0,
      signature: json['signature'] as String? ?? '',
      title: json['title'] as String? ?? '',
      hlsUrl: json['hlsUrl'] as String? ?? '',
      directPlayUrl: json['directPlayUrl'] as String? ?? '',
    );
  }
}

class BunnyUploadResult {
  const BunnyUploadResult({
    required this.videoId,
    required this.fileName,
    required this.hlsUrl,
    required this.directPlayUrl,
    required this.title,
    this.sizeBytes,
    this.mimeType,
  });

  final String videoId;
  final String fileName;
  final String hlsUrl;
  final String directPlayUrl;
  final String title;
  final int? sizeBytes;
  final String? mimeType;

  factory BunnyUploadResult.fromJson(Map<String, dynamic> json) {
    return BunnyUploadResult(
      videoId: json['videoId'] as String? ?? '',
      fileName: json['fileName'] as String? ?? '',
      hlsUrl: json['hlsUrl'] as String? ?? '',
      directPlayUrl: json['directPlayUrl'] as String? ?? '',
      title: json['title'] as String? ?? '',
      sizeBytes: (json['sizeBytes'] as num?)?.toInt(),
      mimeType: json['mimeType'] as String?,
    );
  }
}
