
class BadgeInfo {
  final String level;
  final String name;
  final int minKNP;
  final int? maxKNP;
  final String color;
  final String icon;
  final List<String> benefits;

  BadgeInfo({
    required this.level,
    required this.name,
    required this.minKNP,
    this.maxKNP,
    required this.color,
    required this.icon,
    required this.benefits,
  });

  factory BadgeInfo.fromJson(Map<String, dynamic> json) {
    return BadgeInfo(
      level: json['level'] as String,
      name: json['name'] as String,
      minKNP: json['minKNP'] as int,
      maxKNP: json['maxKNP'] as int?,
      color: json['color'] as String,
      icon: json['icon'] as String,
      benefits: List<String>.from(json['benefits']),
    );
  }
}

class Transaction {
  final int id;
  final double amount;
  final String type;
  final String reason;
  final String status;
  final DateTime createdAt;

  Transaction({
    required this.id,
    required this.amount,
    required this.type,
    required this.reason,
    required this.status,
    required this.createdAt,
  });

  factory Transaction.fromJson(Map<String, dynamic> json) {
    return Transaction(
      id: json['id'] as int,
      amount: (json['amount'] as num).toDouble(),
      type: json['type'] as String,
      reason: json['reason'] as String,
      status: json['status'] as String,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }
}

class WalletData {
  final Wallet wallet;
  final BadgeProgressData badge;
  final List<Transaction> transactions;

  WalletData({
    required this.wallet,
    required this.badge,
    required this.transactions,
  });

  factory WalletData.fromJson(Map<String, dynamic> json) {
    return WalletData(
      wallet: Wallet.fromJson(json['wallet'] as Map<String, dynamic>),
      badge: BadgeProgressData.fromJson(json['badge'] as Map<String, dynamic>),
      transactions: (json['transactions'] as List)
          .map((e) => Transaction.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}

class Wallet {
  final double balance;
  final double totalEarned;
  final double totalSpent;

  Wallet({
    required this.balance,
    required this.totalEarned,
    required this.totalSpent,
  });

  factory Wallet.fromJson(Map<String, dynamic> json) {
    return Wallet(
      balance: (json['balance'] as num).toDouble(),
      totalEarned: (json['totalEarned'] as num).toDouble(),
      totalSpent: (json['totalSpent'] as num).toDouble(),
    );
  }
}

class BadgeProgressData {
  final BadgeInfo current;
  final BadgeInfo? next;
  final double progressPercentage;
  final int kpToNext;

  BadgeProgressData({
    required this.current,
    this.next,
    required this.progressPercentage,
    required this.kpToNext,
  });

  factory BadgeProgressData.fromJson(Map<String, dynamic> json) {
    return BadgeProgressData(
      current: BadgeInfo.fromJson(json['current'] as Map<String, dynamic>),
      next: json['next'] != null
          ? BadgeInfo.fromJson(json['next'] as Map<String, dynamic>)
          : null,
      progressPercentage: (json['progressPercentage'] as num).toDouble(),
      kpToNext: json['kpToNext'] as int,
    );
  }
}
