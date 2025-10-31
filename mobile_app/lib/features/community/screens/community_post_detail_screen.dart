
import 'package:flutter/material.dart';
import 'package:mobile_app/data/models/community_models.dart';
import 'package:mobile_app/data/services/community_api_service.dart';
import 'package:mobile_app/data/services/auth_service.dart';
import 'package:intl/intl.dart';

class CommunityPostDetailScreen extends StatefulWidget {
  final int postId;

  const CommunityPostDetailScreen({super.key, required this.postId});

  @override
  State<CommunityPostDetailScreen> createState() => _CommunityPostDetailScreenState();
}

class _CommunityPostDetailScreenState extends State<CommunityPostDetailScreen> {
  final CommunityApiService _apiService = CommunityApiService();
  Post? _post;
  bool _isLoading = true;
  String? _errorMessage;
  final TextEditingController _commentController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _fetchPostDetails();
  }

  Future<void> _fetchPostDetails() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    try {
      final fetchedPost = await _apiService.getPost(widget.postId);
      setState(() {
        _post = fetchedPost;
      });
    } catch (e) {
      setState(() {
        _errorMessage = e.toString();
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _toggleLike() async {
    if (_post == null) return;
    try {
      final result = await _apiService.toggleLike(_post!.id);
      setState(() {
        _post = _post!.copyWith(
          isLikedByCurrentUser: result['isLiked'],
          likesCount: result['likesCount'],
        );
      });
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to toggle like: $e')),
      );
    }
  }

  Future<void> _addComment() async {
    if (_post == null || _commentController.text.isEmpty) return;
    try {
      final newComment = await _apiService.addComment(_post!.id, _commentController.text);
      setState(() {
        _post = _post!.copyWith(
          comments: [...?_post!.comments, newComment],
          commentsCount: _post!.commentsCount + 1,
        );
        _commentController.clear();
      });
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to add comment: $e')),
      );
    }
  }

  Future<void> _deleteComment(int commentId) async {
    if (_post == null) return;
    try {
      await _apiService.deleteComment(_post!.id, commentId);
      setState(() {
        _post = _post!.copyWith(
          comments: _post!.comments?.where((c) => c.id != commentId).toList(),
          commentsCount: _post!.commentsCount - 1,
        );
      });
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to delete comment: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final currentUserId = AuthService().user?['id'];

    return Scaffold(
      appBar: AppBar(
        title: const Text('Détails du Post'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _errorMessage != null
              ? Center(child: Text('Error: $_errorMessage'))
              : _post == null
                  ? const Center(child: Text('Post not found.'))
                  : ListView(
                      padding: const EdgeInsets.all(16.0),
                      children: [
                        _buildPostHeader(currentUserId),
                        const SizedBox(height: 16),
                        Text(
                          _post!.title,
                          style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 12),
                        Text(
                          _post!.content,
                          style: Theme.of(context).textTheme.bodyLarge,
                        ),
                        const SizedBox(height: 16),
                        _buildPostActions(currentUserId),
                        const Divider(),
                        _buildCommentSection(currentUserId),
                      ],
                    ),
    );
  }

  Widget _buildPostHeader(int? currentUserId) {
    return Row(
      children: [
        CircleAvatar(
          backgroundImage: _post!.author.avatar != null
              ? NetworkImage(_post!.author.avatar!)
              : null,
          child: _post!.author.avatar == null
              ? Text(_post!.author.name[0])
              : null,
        ),
        const SizedBox(width: 10),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              _post!.author.name,
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
            Text(
              DateFormat('dd MMM yyyy HH:mm').format(_post!.createdAt),
              style: const TextStyle(color: Colors.grey, fontSize: 12),
            ),
          ],
        ),
        const Spacer(),
        Chip(
          label: Text(_post!.category.name),
          backgroundColor: Theme.of(context).primaryColor.withOpacity(0.1),
        ),
        if (currentUserId == _post!.author.id)
          PopupMenuButton<String>(
            onSelected: (value) {
              if (value == 'edit') {
                // TODO: Navigate to EditPostScreen
                print('Edit post ${_post!.id}');
              } else if (value == 'delete') {
                // TODO: Implement delete post
                print('Delete post ${_post!.id}');
              }
            },
            itemBuilder: (BuildContext context) => <PopupMenuEntry<String>>[
              const PopupMenuItem<String>(
                value: 'edit',
                child: Text('Modifier'),
              ),
              const PopupMenuItem<String>(
                value: 'delete',
                child: Text('Supprimer'),
              ),
            ],
          ),
      ],
    );
  }

  Widget _buildPostActions(int? currentUserId) {
    return Row(
      children: [
        IconButton(
          icon: Icon(
            _post!.isLikedByCurrentUser ? Icons.favorite : Icons.favorite_border,
            color: _post!.isLikedByCurrentUser ? Colors.red : Colors.grey,
          ),
          onPressed: _toggleLike,
        ),
        Text('${_post!.likesCount}'),
        const SizedBox(width: 16),
        const Icon(Icons.comment),
        const SizedBox(width: 4),
        Text('${_post!.commentsCount}'),
      ],
    );
  }

  Widget _buildCommentSection(int? currentUserId) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Commentaires',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: TextField(
                controller: _commentController,
                decoration: const InputDecoration(
                  hintText: 'Ajouter un commentaire...',
                  border: OutlineInputBorder(),
                ),
              ),
            ),
            IconButton(
              icon: const Icon(Icons.send),
              onPressed: _addComment,
            ),
          ],
        ),
        const SizedBox(height: 16),
        if (_post!.comments != null && _post!.comments!.isNotEmpty)
          ListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: _post!.comments!.length,
            itemBuilder: (context, index) {
              final comment = _post!.comments![index];
              return Card(
                margin: const EdgeInsets.symmetric(vertical: 8.0),
                child: ListTile(
                  leading: CircleAvatar(
                    backgroundImage: comment.author.avatar != null
                        ? NetworkImage(comment.author.avatar!)
                        : null,
                    child: comment.author.avatar == null
                        ? Text(comment.author.name[0])
                        : null,
                  ),
                  title: Text(comment.author.name, style: const TextStyle(fontWeight: FontWeight.bold)),
                  subtitle: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(comment.content),
                      Text(
                        DateFormat('dd MMM yyyy HH:mm').format(comment.createdAt),
                        style: const TextStyle(color: Colors.grey, fontSize: 12),
                      ),
                    ],
                  ),
                  trailing: currentUserId == comment.author.id
                      ? IconButton(
                          icon: const Icon(Icons.delete, color: Colors.red),
                          onPressed: () => _deleteComment(comment.id),
                        )
                      : null,
                ),
              );
            },
          )
        else
          const Center(child: Text('Aucun commentaire pour le moment.')),
      ],
    );
  }
}
