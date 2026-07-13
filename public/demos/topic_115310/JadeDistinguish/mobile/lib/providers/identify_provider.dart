import 'package:flutter/material.dart';
import '../models/identify_record.dart';
import '../services/identify_service.dart';

class IdentifyProvider with ChangeNotifier {
  final IdentifyService _service = IdentifyService();
  
  IdentifyRecord? _currentRecord;
  List<IdentifyRecord> _historyRecords = [];
  bool _isLoading = false;
  String? _error;

  IdentifyRecord? get currentRecord => _currentRecord;
  List<IdentifyRecord> get historyRecords => _historyRecords;
  bool get isLoading => _isLoading;
  String? get error => _error;

  void setCurrentRecord(IdentifyRecord? record) {
    _currentRecord = record;
    notifyListeners();
  }

  Future<void> identify(String imagePath) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final record = await _service.identify(imagePath);
      _currentRecord = record;
      
      // 添加到历史记录
      _historyRecords.insert(0, record);
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> loadHistory() async {
    _isLoading = true;
    notifyListeners();

    try {
      _historyRecords = await _service.getHistory();
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }
}
