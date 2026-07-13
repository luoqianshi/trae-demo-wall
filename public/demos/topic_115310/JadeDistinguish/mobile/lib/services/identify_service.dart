import 'dart:convert';
import 'package:dio/dio.dart';
import '../core/api_service.dart';
import '../models/identify_record.dart';

class IdentifyService {
  Future<IdentifyRecord> identify(String imagePath) async {
    try {
      final formData = FormData.fromMap({
        'file': await MultipartFile.fromFile(imagePath),
        'jade_type': '和田玉',
        'light_mode': 'side_45',
      });

      final response = await ApiService.upload('/identify', formData);
      
      if (response.statusCode == 200) {
        return IdentifyRecord.fromJson(response.data);
      } else {
        throw Exception('鉴别失败: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('网络错误: $e');
    }
  }

  Future<List<IdentifyRecord>> getHistory({int userId = 1}) async {
    try {
      final response = await ApiService.get('/identify', queryParameters: {
        'user_id': userId,
        'limit': 50,
      });

      if (response.statusCode == 200) {
        final List<dynamic> data = response.data;
        return data.map((json) => IdentifyRecord.fromJson(json)).toList();
      } else {
        throw Exception('获取历史失败: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('网络错误: $e');
    }
  }
}
