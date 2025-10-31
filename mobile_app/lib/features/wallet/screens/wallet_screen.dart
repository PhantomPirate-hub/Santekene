
import 'package:flutter/material.dart';
import 'package:mobile_app/data/models/wallet_models.dart';
import 'package:mobile_app/data/services/wallet_api_service.dart';
import 'package:intl/intl.dart'; // For date formatting

class WalletScreen extends StatefulWidget {
  const WalletScreen({super.key});

  @override
  State<WalletScreen> createState() => _WalletScreenState();
}

class _WalletScreenState extends State<WalletScreen> {
  late Future<Map<String, dynamic>> _walletDataFuture;
  final WalletApiService _apiService = WalletApiService();

  bool _showExplanations = false;

  @override
  void initState() {
    super.initState();
    _walletDataFuture = _fetchWalletData();
  }

  Future<Map<String, dynamic>> _fetchWalletData() async {
    try {
      final walletInfo = await _apiService.getWalletInfo();
      final badgeLevels = await _apiService.getBadgeLevels();
      return {
        'walletInfo': walletInfo,
        'badgeLevels': badgeLevels,
      };
    } catch (e) {
      throw Exception('Failed to load wallet data: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Mon Portefeuille KènèPoints'),
      ),
      body: FutureBuilder<Map<String, dynamic>>(
        future: _walletDataFuture,
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          if (snapshot.hasError) {
            return Center(child: Text('Error: ${snapshot.error}'));
          }

          if (!snapshot.hasData) {
            return const Center(child: Text('No data found.'));
          }

          final WalletData walletData = snapshot.data!['walletInfo'];
          final List<BadgeInfo> badgeLevels = snapshot.data!['badgeLevels'];

          return ListView(
            padding: const EdgeInsets.all(16.0),
            children: [
              _buildBalanceCard(walletData.wallet),
              const SizedBox(height: 16),
              _buildBadgeProgress(walletData.badge),
              const SizedBox(height: 16),
              _buildBadgeExplanations(badgeLevels),
              const SizedBox(height: 16),
              _buildTransactionHistory(walletData.transactions),
            ],
          );
        },
      ),
    );
  }

  Widget _buildBalanceCard(Wallet wallet) {
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
      color: Theme.of(context).primaryColor,
      child: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Solde actuel',
              style: TextStyle(color: Colors.white70, fontSize: 16),
            ),
            const SizedBox(height: 8),
            Text(
              '${wallet.balance.toStringAsFixed(2)} KNP',
              style: const TextStyle(
                color: Colors.white,
                fontSize: 36,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Total gagné', style: TextStyle(color: Colors.white70)),
                    Text(
                      '${wallet.totalEarned.toStringAsFixed(2)} KNP',
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
                // Column(
                //   crossAxisAlignment: CrossAxisAlignment.start,
                //   children: [
                //     const Text('Total dépensé', style: TextStyle(color: Colors.white70)),
                //     Text(
                //       '${wallet.totalSpent.toStringAsFixed(2)} KNP',
                //       style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                //     ),
                //   ],
                // ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBadgeProgress(BadgeProgressData badge) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Votre Badge Actuel: ${badge.current.name}',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            LinearProgressIndicator(
              value: badge.progressPercentage / 100,
              backgroundColor: Colors.grey[300],
              color: Theme.of(context).primaryColor,
            ),
            const SizedBox(height: 8),
            Text(
              '${badge.kpToNext} KNP pour le prochain badge (${badge.next?.name ?? 'N/A'})',
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBadgeExplanations(List<BadgeInfo> badgeLevels) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
      child: ExpansionTile(
        title: const Text('Niveaux de Badges', style: TextStyle(fontWeight: FontWeight.bold)),
        leading: const Icon(Icons.info_outline),
        onExpansionChanged: (expanded) {
          setState(() {
            _showExplanations = expanded;
          });
        },
        initiallyExpanded: _showExplanations,
        children: [
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: badgeLevels.map((level) {
                return Padding(
                  padding: const EdgeInsets.symmetric(vertical: 8.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '${level.name} (${level.minKNP} ${level.maxKNP != null ? '- ${level.maxKNP}' : '+'} KNP)',
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                      ),
                      const SizedBox(height: 4),
                      ...level.benefits.map((benefit) => Text('- $benefit')).toList(),
                    ],
                  ),
                );
              }).toList(),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTransactionHistory(List<Transaction> transactions) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Historique des Gains',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            if (transactions.isEmpty)
              const Padding(
                padding: EdgeInsets.all(20.0),
                child: Center(child: Text('Aucune transaction pour le moment')),
              )
            else
              ListView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: transactions.length,
                itemBuilder: (context, index) {
                  final tx = transactions[index];
                  return Card(
                    margin: const EdgeInsets.symmetric(vertical: 8.0),
                    child: ListTile(
                      leading: Icon(
                        tx.amount >= 0 ? Icons.arrow_upward : Icons.arrow_downward,
                        color: tx.amount >= 0 ? Colors.green : Colors.red,
                      ),
                      title: Text(tx.reason),
                      subtitle: Text(DateFormat('dd MMM yyyy HH:mm').format(tx.createdAt)),
                      trailing: Text(
                        '${tx.amount >= 0 ? '+' : ''}${tx.amount.toStringAsFixed(2)} KNP',
                        style: TextStyle(
                          color: tx.amount >= 0 ? Colors.green : Colors.red,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  );
                },
              ),
          ],
        ),
      ),
    );
  }
}
