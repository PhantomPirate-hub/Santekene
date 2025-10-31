
import 'package:http/http.dart' as http;
import 'dart:convert';

import 'package:mobile_app/data/models/community_models.dart';
import 'package:mobile_app/data/services/auth_service.dart';

class CommunityApiService {
  final String _baseUrl = 'http://localhost:3001/api/community';
  final String _categoriesUrl = 'http://localhost:3001/api/categories';

  Future<List<Category>> getCategories() async {
    final token = AuthService().token;
    if (token == null) {
      throw Exception('User is not authenticated');
    }

    final response = await http.get(
      Uri.parse(_categoriesUrl),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body)['categories'];
      return data.map((json) => Category.fromJson(json)).toList();
    } else {
      throw Exception('Failed to load categories');
    }
  }

  Future<List<Post>> getPosts({
    String? search,
    int? categoryId,
    String? sortBy,
    int page = 1,
    int limit = 10,
    bool myPosts = false,
  }) async {
    final token = AuthService().token;
    if (token == null) {
      throw Exception('User is not authenticated');
    }

    final Map<String, String> queryParams = {
      'page': page.toString(),
      'limit': limit.toString(),
    };

    if (search != null && search.isNotEmpty) {
      queryParams['search'] = search;
    }
    if (categoryId != null) {
      queryParams['categoryId'] = categoryId.toString();
    }
    if (sortBy != null) {
      queryParams['sortBy'] = sortBy;
    }

    final String url = myPosts ? '$_baseUrl/my-posts' : '$_baseUrl/posts';
    final uri = Uri.parse(url).replace(queryParameters: queryParams);

    final response = await http.get(
      uri,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode == 200) {
      final Map<String, dynamic> responseData = jsonDecode(response.body);
      final List<dynamic> data = myPosts ? responseData : responseData['posts'];
      return data.map((json) => Post.fromJson(json)).toList();
    } else {
      throw Exception('Failed to load posts');
    }
  }

  Future<Post> getPost(int postId) async {
    final token = AuthService().token;
    if (token == null) {
      throw Exception('User is not authenticated');
    }

    final response = await http.get(
      Uri.parse('$_baseUrl/posts/$postId'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode == 200) {
      return Post.fromJson(jsonDecode(response.body));
    } else {
      throw Exception('Failed to load post');
    }
  }

  Future<Post> createPost(String title, String content, int categoryId) async {
    final token = AuthService().token;
    if (token == null) {
      throw Exception('User is not authenticated');
    }

    final response = await http.post(
      Uri.parse('$_baseUrl/posts'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({
        'title': title,
        'content': content,
        'categoryId': categoryId,
      }),
    );

    if (response.statusCode == 201) {
      return Post.fromJson(jsonDecode(response.body));
    } else {
      throw Exception('Failed to create post');
    }
  }

  Future<Post> updatePost(int postId, String title, String content, int categoryId) async {
    final token = AuthService().token;
    if (token == null) {
      throw Exception('User is not authenticated');
    }

    final response = await http.put(
      Uri.parse('$_baseUrl/posts/$postId'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({
        'title': title,
        'content': content,
        'categoryId': categoryId,
      }),
    );

    if (response.statusCode == 200) {
      return Post.fromJson(jsonDecode(response.body));
    } else {
      throw Exception('Failed to update post');
    }
  }

  Future<void> deletePost(int postId) async {
    final token = AuthService().token;
    if (token == null) {
      throw Exception('User is not authenticated');
    }

    final response = await http.delete(
      Uri.parse('$_baseUrl/posts/$postId'),
      headers: {
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode != 200) {
      throw Exception('Failed to delete post');
    }
  }

  Future<Map<String, dynamic>> toggleLike(int postId) async {
    final token = AuthService().token;
    if (token == null) {
      throw Exception('User is not authenticated');
    }

    final response = await http.post(
      Uri.parse('$_baseUrl/posts/$postId/like'),
      headers: {
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to toggle like');
    }
  }

  Future<Comment> addComment(int postId, String content) async {
    final token = AuthService().token;
    if (token == null) {
      throw Exception('User is not authenticated');
    }

    final response = await http.post(
      Uri.parse('$_baseUrl/posts/$postId/comments'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
      body: jsonEncode({'content': content}),
    );

    if (response.statusCode == 201) {
      return Comment.fromJson(jsonDecode(response.body));
    } else {
      throw Exception('Failed to add comment');
    }
  }

  Future<void> deleteComment(int postId, int commentId) async {
    final token = AuthService().token;
    if (token == null) {
      throw Exception('User is not authenticated');
    }

    final response = await http.delete(
      Uri.parse('$_baseUrl/posts/$postId/comments/$commentId'),
      headers: {
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode != 200) {
      throw Exception('Failed to delete comment');
    }
  }
}
