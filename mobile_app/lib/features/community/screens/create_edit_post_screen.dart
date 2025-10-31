
import 'package:flutter/material.dart';
import 'package:mobile_app/data/models/community_models.dart';
import 'package:mobile_app/data/services/community_api_service.dart';

class CreateEditPostScreen extends StatefulWidget {
  final Post? postToEdit;

  const CreateEditPostScreen({super.key, this.postToEdit});

  @override
  State<CreateEditPostScreen> createState() => _CreateEditPostScreenState();
}

class _CreateEditPostScreenState extends State<CreateEditPostScreen> {
  final _formKey = GlobalKey<FormState>();
  final _titleController = TextEditingController();
  final _contentController = TextEditingController();
  final CommunityApiService _apiService = CommunityApiService();

  List<Category> _categories = [];
  int? _selectedCategoryId;
  bool _isLoading = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _fetchCategories();
    if (widget.postToEdit != null) {
      _titleController.text = widget.postToEdit!.title;
      _contentController.text = widget.postToEdit!.content;
      _selectedCategoryId = widget.postToEdit!.category.id;
    }
  }

  Future<void> _fetchCategories() async {
    try {
      final fetchedCategories = await _apiService.getCategories();
      setState(() {
        _categories = fetchedCategories;
        if (_selectedCategoryId == null && _categories.isNotEmpty) {
          _selectedCategoryId = _categories.first.id;
        }
      });
    } catch (e) {
      setState(() {
        _errorMessage = e.toString();
      });
    }
  }

  Future<void> _submitPost() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    if (_selectedCategoryId == null) {
      setState(() {
        _errorMessage = 'Please select a category.';
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      if (widget.postToEdit == null) {
        // Create new post
        await _apiService.createPost(
          _titleController.text,
          _contentController.text,
          _selectedCategoryId!,
        );
      } else {
        // Update existing post
        await _apiService.updatePost(
          widget.postToEdit!.id,
          _titleController.text,
          _contentController.text,
          _selectedCategoryId!,
        );
      }
      Navigator.of(context).pop(true); // Pop with true to indicate success
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

  @override
  void dispose() {
    _titleController.dispose();
    _contentController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(widget.postToEdit == null ? 'Créer un Post' : 'Modifier le Post'),
      ),
      body: _isLoading && _categories.isEmpty
          ? const Center(child: CircularProgressIndicator())
          : Padding(
              padding: const EdgeInsets.all(16.0),
              child: Form(
                key: _formKey,
                child: ListView(
                  children: [
                    TextFormField(
                      controller: _titleController,
                      decoration: const InputDecoration(
                        labelText: 'Titre',
                        border: OutlineInputBorder(),
                      ),
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Veuillez entrer un titre';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),
                    DropdownButtonFormField<int>(
                      value: _selectedCategoryId,
                      decoration: const InputDecoration(
                        labelText: 'Catégorie',
                        border: OutlineInputBorder(),
                      ),
                      items: _categories.map((category) {
                        return DropdownMenuItem(
                          value: category.id,
                          child: Text(category.name),
                        );
                      }).toList(),
                      onChanged: (value) {
                        setState(() {
                          _selectedCategoryId = value;
                        });
                      },
                      validator: (value) {
                        if (value == null) {
                          return 'Veuillez sélectionner une catégorie';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _contentController,
                      maxLines: 8,
                      decoration: const InputDecoration(
                        labelText: 'Contenu',
                        border: OutlineInputBorder(),
                      ),
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Veuillez entrer le contenu du post';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 24),
                    if (_errorMessage != null)
                      Padding(
                        padding: const EdgeInsets.only(bottom: 16.0),
                        child: Text(
                          _errorMessage!,
                          style: const TextStyle(color: Colors.red, fontWeight: FontWeight.bold),
                          textAlign: TextAlign.center,
                        ),
                      ),
                    ElevatedButton(
                      onPressed: _isLoading ? null : _submitPost,
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(30),
                        ),
                      ),
                      child: _isLoading
                          ? const CircularProgressIndicator(color: Colors.white)
                          : Text(widget.postToEdit == null ? 'Publier le Post' : 'Enregistrer les modifications'),
                    ),
                  ],
                ),
              ),
            ),
    );
  }
}
