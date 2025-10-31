
class Author {
  final int id;
  final String name;
  final String role;
  final String? avatar;

  Author({
    required this.id,
    required this.name,
    required this.role,
    this.avatar,
  });

  factory Author.fromJson(Map<String, dynamic> json) {
    return Author(
      id: json['id'] as int,
      name: json['name'] as String,
      role: json['role'] as String,
      avatar: json['avatar'] as String?,
    );
  }
}

class Comment {
  final int id;
  final String content;
  final DateTime createdAt;
  final Author author;

  Comment({
    required this.id,
    required this.content,
    required this.createdAt,
    required this.author,
  });

  factory Comment.fromJson(Map<String, dynamic> json) {
    return Comment(
      id: json['id'] as int,
      content: json['content'] as String,
      createdAt: DateTime.parse(json['createdAt'] as String),
      author: Author.fromJson(json['author'] as Map<String, dynamic>),
    );
  }
}

class Category {
  final int id;
  final String name;
  final bool isActive;

  Category({
    required this.id,
    required this.name,
    required this.isActive,
  });

  factory Category.fromJson(Map<String, dynamic> json) {
    return Category(
      id: json['id'] as int,
      name: json['name'] as String,
      isActive: json['isActive'] as bool,
    );
  }
}

class Post {
  final int id;
  final String title;
  final String content;
  final Category category;
  final DateTime createdAt;
  final Author author;
  final int likesCount;
  final int commentsCount;
  final bool isLikedByCurrentUser;
  final List<Comment>? comments;

  Post({
    required this.id,
    required this.title,
    required this.content,
    required this.category,
    required this.createdAt,
    required this.author,
    required this.likesCount,
    required this.commentsCount,
    required this.isLikedByCurrentUser,
    this.comments,
  });

  factory Post.fromJson(Map<String, dynamic> json) {
    return Post(
      id: json['id'] as int,
      title: json['title'] as String,
      content: json['content'] as String,
      category: Category.fromJson(json['category'] as Map<String, dynamic>),
      createdAt: DateTime.parse(json['createdAt'] as String),
      author: Author.fromJson(json['author'] as Map<String, dynamic>),
      likesCount: json['likesCount'] as int,
      commentsCount: json['commentsCount'] as int,
      isLikedByCurrentUser: json['isLikedByCurrentUser'] as bool,
      comments: (json['comments'] as List<dynamic>?)
          ?.map((e) => Comment.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }

  Post copyWith({
    int? id,
    String? title,
    String? content,
    Category? category,
    DateTime? createdAt,
    Author? author,
    int? likesCount,
    int? commentsCount,
    bool? isLikedByCurrentUser,
    List<Comment>? comments,
  }) {
    return Post(
      id: id ?? this.id,
      title: title ?? this.title,
      content: content ?? this.content,
      category: category ?? this.category,
      createdAt: createdAt ?? this.createdAt,
      author: author ?? this.author,
      likesCount: likesCount ?? this.likesCount,
      commentsCount: commentsCount ?? this.commentsCount,
      isLikedByCurrentUser: isLikedByCurrentUser ?? this.isLikedByCurrentUser,
      comments: comments ?? this.comments,
    );
  }
}
