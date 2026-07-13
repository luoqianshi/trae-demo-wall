import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/identify_provider.dart';
import '../app/routes.dart';

class HistoryScreen extends StatefulWidget {
  const HistoryScreen({super.key});

  @override
  State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      context.read<IdentifyProvider>().loadHistory();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('历史记录'),
      ),
      body: Consumer<IdentifyProvider>(
        builder: (context, provider, child) {
          if (provider.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          if (provider.historyRecords.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.history, size: 64, color: Colors.grey[400]),
                  const SizedBox(height: 16),
                  Text(
                    '暂无历史记录',
                    style: TextStyle(fontSize: 16, color: Colors.grey[600]),
                  ),
                ],
              ),
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: provider.historyRecords.length,
            itemBuilder: (context, index) {
              final record = provider.historyRecords[index];
              return Card(
                margin: const EdgeInsets.only(bottom: 12),
                child: ListTile(
                  leading: Image.network(
                    record.imageUrl,
                    width: 60,
                    height: 60,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) {
                      return Container(
                        width: 60,
                        height: 60,
                        color: Colors.grey[300],
                        child: const Icon(Icons.image),
                      );
                    },
                  ),
                  title: Text(record.jadeType),
                  subtitle: Text(
                    '${record.createdAt.year}-${record.createdAt.month.toString().padLeft(2, '0')}-${record.createdAt.day.toString().padLeft(2, '0')}',
                  ),
                  trailing: _buildStatusIcon(record),
                  onTap: () {
                    provider.setCurrentRecord(record);
                    Navigator.pushNamed(
                      context,
                      AppRoutes.result,
                      arguments: {'recordId': record.id},
                    );
                  },
                ),
              );
            },
          );
        },
      ),
    );
  }

  Widget _buildStatusIcon(record) {
    if (record.status != 'completed') {
      return const Icon(Icons.hourglass_empty, color: Colors.orange);
    }

    return Icon(
      record.isAuthentic == true ? Icons.check_circle : Icons.cancel,
      color: record.isAuthentic == true ? Colors.green : Colors.red,
      size: 32,
    );
  }
}
