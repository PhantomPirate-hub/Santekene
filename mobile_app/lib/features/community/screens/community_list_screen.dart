
import 'package:flutter/material.dart';
import 'package:mobile_app/data/models/community_models.dart';
import 'package:mobile_app/data/services/community_api_service.dart';
import 'package:mobile_app/data/services/auth_service.dart';
import 'package:intl/intl.dart';
import 'package:mobile_app/features/community/screens/community_post_detail_screen.dart';
import 'package:mobile_app/features/community/screens/create_edit_post_screen.dart';

class CommunityListScreen extends StatefulWidget {
  const CommunityListScreen({super.key});

  @override
  State<CommunityListScreen> createState() => _CommunityListScreenState();
}

class _CommunityListScreenState extends State<CommunityListScreen> {
  final CommunityApiService _apiService = CommunityApiService();
  List<Post> _posts = [];
  List<Category> _categories = [];
  bool _isLoading = true;
  String? _errorMessage;

  String _searchQuery = '';
  int? _selectedCategoryId;
  String _sortBy = 'recent'; // 'recent' or 'popular'
  int _currentPage = 1;
  int _totalPages = 1;

  @override
  void initState() {
    super.initState();
    _fetchData();
  }

  Future<void> _fetchData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });
    try {
      final fetchedCategories = await _apiService.getCategories();
      final fetchedPosts = await _apiService.getPosts(
        search: _searchQuery,
        categoryId: _selectedCategoryId,
        sortBy: _sortBy,
        page: _currentPage,
      );
      setState(() {
        _categories = fetchedCategories;
        _posts = fetchedPosts;
        // TODO: Update totalPages from API response if available
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

  void _onSearchChanged(String query) {
    setState(() {
      _searchQuery = query;
      _currentPage = 1;
    });
    _fetchData();
  }

  void _onCategorySelected(int? categoryId) {
    setState(() {
      _selectedCategoryId = categoryId;
      _currentPage = 1;
    });
    _fetchData();
  }

  void _onSortByChanged(String sortBy) {
    setState(() {
      _sortBy = sortBy;
      _currentPage = 1;
    });
    _fetchData();
  }

  void _onPageChanged(int newPage) {
    setState(() {
      _currentPage = newPage;
    });
    _fetchData();
  }

  Future<void> _toggleLike(Post post) async {
    try {
      final result = await _apiService.toggleLike(post.id);
      setState(() {
        final index = _posts.indexOf(post);
        if (index != -1) {
          _posts[index] = post.copyWith(
            isLikedByCurrentUser: result['isLiked'],
            likesCount: result['likesCount'],
          );
        }
      });
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Failed to toggle like: $e')),
      );
    }
  }

  Future<void> _deletePost(int postId) async {
    final confirmDelete = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Supprimer le post'),
        content: const Text('Êtes-vous sûr de vouloir supprimer ce post ?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Annuler'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Supprimer', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );

    if (confirmDelete == true) {
      try {
        await _apiService.deletePost(postId);
        _fetchData(); // Refresh posts
      } catch (e) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to delete post: $e')),
        );
      }
    }
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final difference = now.difference(date);

    if (difference.inSeconds < 60) {
      return 'À l\'instant';
    } else if (difference.inMinutes < 60) {
      return 'Il y a ${difference.inMinutes} min';
    } else if (difference.inHours < 24) {
      return 'Il y a ${difference.inHours} h';
    } else if (difference.inDays < 7) {
      return 'Il y a ${difference.inDays} j';
    } else {
      return DateFormat('dd MMM yyyy', 'fr_FR').format(date);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Communauté Santé Kènè'),
      ),
      body: Column(
        children: [
          _buildSearchBarAndFilters(),
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _errorMessage != null
                    ? Center(child: Text('Error: $_errorMessage'))
                    : _posts.isEmpty
                        ? const Center(child: Text('Aucun post trouvé.'))
                        : ListView.builder(
                            padding: const EdgeInsets.all(16.0),
                            itemCount: _posts.length,
                            itemBuilder: (context, index) {
                              final post = _posts[index];
                              return _buildPostCard(post);
                            },
                          ),
          ),
          _buildPaginationControls(),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () async {
          final result = await Navigator.of(context).push<bool>(
            MaterialPageRoute(builder: (context) => const CreateEditPostScreen()),
          );
          if (result == true) {
            _fetchData(); // Refresh posts if a new one was created
          }
        },
        child: const Icon(Icons.add),
      ),
    );
  }

  Widget _buildSearchBarAndFilters() {
    return Padding(
      padding: const EdgeInsets.all(8.0),
      child: Column(
        children: [
          TextField(
            onChanged: _onSearchChanged,
            decoration: const InputDecoration(
              hintText: 'Rechercher un post...',
              prefixIcon: Icon(Icons.search),
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: DropdownButtonFormField<int?>(
                  value: _selectedCategoryId,
                  hint: const Text('Catégorie'),
                  onChanged: _onCategorySelected,
                  items: [
                    const DropdownMenuItem(value: null, child: Text('Toutes')),
                    ..._categories.map((category) => DropdownMenuItem(
                      value: category.id,
                      child: Text(category.name),
                    )),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: DropdownButtonFormField<String>(
                  value: _sortBy,
                  hint: const Text('Trier par'),
                  onChanged: (value) => _onSortByChanged(value!),
                  items: const [
                    DropdownMenuItem(value: 'recent', child: Text('Plus récents')),
                    DropdownMenuItem(value: 'popular', child: Text('Plus populaires')),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildPostCard(Post post) {
    final currentUserId = AuthService().user?['id'];
    final isAuthor = currentUserId == post.author.id;

    return InkWell(
      onTap: () async {
        await Navigator.of(context).push(
          MaterialPageRoute(
            builder: (context) => CommunityPostDetailScreen(postId: post.id),
          ),
        );
        _fetchData(); // Refresh data in case of like/comment changes
      },
      child: Card(
        margin: const EdgeInsets.only(bottom: 16.0),
        elevation: 2,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  CircleAvatar(
                    backgroundImage: post.author.avatar != null
                        ? NetworkImage(post.author.avatar!)
                        : null,
                    child: post.author.avatar == null
                        ? Text(post.author.name[0])
                        : null,
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          post.author.name,
                          style: const TextStyle(fontWeight: FontWeight.bold),
                        ),
                        Text(
                          _formatDate(post.createdAt),
                          style: const TextStyle(color: Colors.grey, fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                  if (isAuthor)
                    PopupMenuButton<String>(
                      onSelected: (value) async {
                        if (value == 'edit') {
                          final result = await Navigator.of(context).push<bool>(
                            MaterialPageRoute(
                              builder: (context) =>
                                  CreateEditPostScreen(postToEdit: post),
                            ),
                          );
                          if (result == true) {
                            _fetchData();
                          }
                        } else if (value == 'delete') {
                          _deletePost(post.id);
                        }
                      },
                      itemBuilder: (BuildContext context) =>
                          <PopupMenuEntry<String>>[
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
              ),
              const SizedBox(height: 16),
              Text(
                post.title,
                style:
                    const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              Text(post.content),
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      IconButton(
                        icon: Icon(
                          post.isLikedByCurrentUser
                              ? Icons.favorite
                              : Icons.favorite_border,
                          color: post.isLikedByCurrentUser
                              ? Colors.red
                              : Colors.grey,
                        ),
                        onPressed: () => _toggleLike(post),
                      ),
                      Text('${post.likesCount}'),
                      const SizedBox(width: 16),
                      IconButton(
                        icon: const Icon(Icons.comment),
                        onPressed: () async {
                          await Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (context) =>
                                  CommunityPostDetailScreen(postId: post.id),
                            ),
                          );
                          _fetchData();
                        },
                      ),
                      Text('${post.commentsCount}'),
                    ],
                  ),
                  Chip(
                    label: Text(post.category.name),
                    backgroundColor:
                        Theme.of(context).primaryColor.withOpacity(0.1),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPaginationControls() {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          IconButton(
            icon: const Icon(Icons.chevron_left),
            onPressed: _currentPage > 1 ? () => _onPageChanged(_currentPage - 1) : null,
          ),
          Text('Page $_currentPage sur $_totalPages'),
          IconButton(
            icon: const Icon(Icons.chevron_right),
            onPressed: _currentPage < _totalPages ? () => _onPageChanged(_currentPage + 1) : null,
          ),
        ],
      ),
    );
  }
}
