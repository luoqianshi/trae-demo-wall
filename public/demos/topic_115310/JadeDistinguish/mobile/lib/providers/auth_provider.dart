import 'package:flutter/material.dart';

class AuthProvider with ChangeNotifier {
  String? _token;
  String? _userId;
  bool _isLoggedIn = false;

  String? get token => _token;
  String? get userId => _userId;
  bool get isLoggedIn => _isLoggedIn;

  Future<void> login(String phone, String code) async {
    // TODO: 实现登录逻辑
    _isLoggedIn = true;
    notifyListeners();
  }

  void logout() {
    _token = null;
    _userId = null;
    _isLoggedIn = false;
    notifyListeners();
  }
}
