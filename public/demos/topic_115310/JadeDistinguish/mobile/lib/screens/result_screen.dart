import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/identify_provider.dart';
import '../models/identify_record.dart';

class ResultScreen extends StatelessWidget {
  final int recordId;

  const ResultScreen({super.key, required this.recordId});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('鉴别结果'),
      ),
      body: Consumer<IdentifyProvider>(
        builder: (context, provider, child) {
          final record = provider.currentRecord;
          
          if (record == null) {
            return const Center(child: CircularProgressIndicator());
          }

          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // 图片
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(8),
                    child: Image.network(
                      record.imageUrl,
                      height: 300,
                      fit: BoxFit.contain,
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                
                // 结果
                _buildResultCard(record),
                const SizedBox(height: 16),
                
                // 特征分析
                if (record.features != null) ...[
                  _buildSection('特征分析', record.features!),
                  const SizedBox(height: 16),
                ],
                
                // 建议
                if (record.suggestion != null) ...[
                  _buildSection('建议', record.suggestion!),
                ],
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildResultCard(IdentifyRecord record) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  '鉴别结果',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                _buildStatusTag(record),
              ],
            ),
            const SizedBox(height: 16),
            if (record.confidence != null) ...[
              Row(
                children: [
                  const Text('置信度：'),
                  Expanded(
                    child: LinearProgressIndicator(
                      value: record.confidence,
                      backgroundColor: Colors.grey[200],
                      valueColor: AlwaysStoppedAnimation<Color>(
                        record.isAuthentic == true ? Colors.green : Colors.red,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text('${(record.confidence! * 100).toStringAsFixed(1)}%'),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildStatusTag(IdentifyRecord record) {
    if (record.status != 'completed') {
      return Chip(
        label: const Text('处理中'),
        backgroundColor: Colors.orange[100],
      );
    }

    return Chip(
      label: Text(record.isAuthentic == true ? '真品' : '仿品'),
      backgroundColor: record.isAuthentic == true ? Colors.green[100] : Colors.red[100],
      labelStyle: TextStyle(
        color: record.isAuthentic == true ? Colors.green[900] : Colors.red[900],
        fontWeight: FontWeight.bold,
      ),
    );
  }

  Widget _buildSection(String title, String content) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              content,
              style: const TextStyle(height: 1.5),
            ),
          ],
        ),
      ),
    );
  }
}
