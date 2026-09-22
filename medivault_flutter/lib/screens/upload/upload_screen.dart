import 'dart:io';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';
import 'package:provider/provider.dart';
import '../../models/report_model.dart';
import '../../providers/vault_provider.dart';
import '../../widgets/custom_app_bar.dart';

class UploadScreen extends StatefulWidget {
  const UploadScreen({super.key});

  @override
  State<UploadScreen> createState() => _UploadScreenState();
}

class _UploadScreenState extends State<UploadScreen> {
  final TextEditingController _titleController = TextEditingController();
  final TextEditingController _labController = TextEditingController();

  String _kind = 'medical'; // 'medical' or 'body_composition'
  String? _selectedFilePath;
  String? _selectedFileName;
  int? _selectedFileSize;

  bool _isProcessing = false;
  String _processingStep = '';
  double _processingProgress = 0.0;

  @override
  void dispose() {
    _titleController.dispose();
    _labController.dispose();
    super.dispose();
  }

  Future<void> _pickImage(ImageSource source) async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(source: source, imageQuality: 88);
    if (picked != null) {
      final file = File(picked.path);
      final size = await file.length();
      setState(() {
        _selectedFilePath = picked.path;
        _selectedFileName = picked.name;
        _selectedFileSize = size;
        if (_titleController.text.isEmpty) {
          _titleController.text = _kind == 'body_composition'
              ? 'Body Composition Scan'
              : 'Lab Diagnostic Report';
        }
      });
    }
  }

  Future<void> _pickFile() async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['pdf', 'jpg', 'jpeg', 'png'],
    );
    if (result != null && result.files.isNotEmpty) {
      final file = result.files.first;
      setState(() {
        _selectedFilePath = file.path;
        _selectedFileName = file.name;
        _selectedFileSize = file.size;
        if (_titleController.text.isEmpty) {
          final cleanTitle = file.name.replaceAll(RegExp(r'\.[^.]+$'), '').replaceAll('_', ' ');
          _titleController.text = cleanTitle;
        }
      });
    }
  }

  Future<void> _handleUploadAndAnalyze() async {
    if (_selectedFilePath == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          backgroundColor: Colors.white,
          content: Text('Please select a file or take a photo first.', style: TextStyle(color: Color(0xFF8A6500))),
        ),
      );
      return;
    }

    final vault = context.read<VaultProvider>();
    final activeMember = vault.activeMember;

    setState(() {
      _isProcessing = true;
      _processingProgress = 0.2;
      _processingStep = 'Preparing secure upload...';
    });

    AppReportModel? newReport;

    try {
      await Future.delayed(const Duration(milliseconds: 500));
      if (mounted) setState(() { _processingProgress = 0.55; _processingStep = 'Running AI Multimodal OCR extraction...'; });
      await Future.delayed(const Duration(milliseconds: 700));
      if (mounted) setState(() { _processingProgress = 0.85; _processingStep = 'Structuring biomarkers against clinical reference ranges...'; });

      final file = File(_selectedFilePath!);
      final title = _titleController.text.trim().isNotEmpty
          ? _titleController.text.trim()
          : (_kind == 'body_composition' ? 'Body Composition Scan' : 'Clinical Diagnostic Report');
      final lab = _labController.text.trim().isNotEmpty ? _labController.text.trim() : 'Diagnostic Lab';

      newReport = await vault.uploadAndAnalyzeReport(
        file: file,
        title: title,
        lab: lab,
        category: _kind == 'body_composition' ? 'Body Composition' : 'General Pathology',
        kind: _kind,
        memberId: activeMember?.id,
      );

      if (mounted) {
        setState(() {
          _processingProgress = 1.0;
          _processingStep = 'Complete';
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            backgroundColor: Colors.white,
            content: Text('Processing error: $e', style: const TextStyle(color: Color(0xFFB8443B))),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isProcessing = false;
        });
      }
    }

    if (newReport != null && mounted) {
      setState(() {
        _processingStep = '';
        _selectedFilePath = null;
        _selectedFileName = null;
        _titleController.clear();
        _labController.clear();
      });

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          backgroundColor: Colors.white,
          content: Text('Report successfully added to vault!', style: TextStyle(color: Color(0xFF087766), fontWeight: FontWeight.w700)),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFEEF3F1),
      appBar: const CustomAppBar(
        title: 'Upload report',
        subtitle: 'Add new document to health vault',
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 40),
        children: [
          // Dashed Upload Container (Matching Web border-[#91cfc2] bg-[#f7fbfa])
          GestureDetector(
            onTap: _isProcessing ? null : () => _showPickerSheet(context),
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 28),
              decoration: BoxDecoration(
                color: const Color(0xFFF7FBFA),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: const Color(0xFF91CFC2),
                  width: 1.5,
                ),
              ),
              child: Column(
                children: [
                  Container(
                    height: 56,
                    width: 56,
                    decoration: BoxDecoration(
                      color: const Color(0xFFE8F7F2),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(
                      Icons.file_upload_outlined,
                      size: 28,
                      color: Color(0xFF087766),
                    ),
                  ),
                  const SizedBox(height: 14),
                  Text(
                    _selectedFileName ?? 'Select a report file',
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w800,
                      color: Color(0xFF162523),
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 6),
                  Text(
                    _kind == 'body_composition'
                        ? 'Upload an InBody, gym scan, or smart-scale photo. The app will detect values and save them for graphs.'
                        : 'PDF, JPG, or PNG. The app will save it, extract key markers, and prepare a doctor-ready summary.',
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontSize: 12,
                      color: Color(0xFF65716F),
                      height: 1.4,
                    ),
                  ),
                  if (_selectedFileSize != null) ...[
                    const SizedBox(height: 8),
                    Text(
                      '${(_selectedFileSize! / 1024).toStringAsFixed(1)} KB',
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w700,
                        color: Color(0xFF087766),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
          const SizedBox(height: 14),

          // Report Kind Switcher (Matching Web Medical report vs Body composition)
          Container(
            padding: const EdgeInsets.all(3),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: const Color(0xFFDCE9E5)),
            ),
            child: Row(
              children: [
                Expanded(
                  child: GestureDetector(
                    onTap: () => setState(() => _kind = 'medical'),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 9),
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: _kind == 'medical' ? const Color(0xFF0D5C46) : Colors.transparent,
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        'Medical report',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w800,
                          color: _kind == 'medical' ? Colors.white : const Color(0xFF52605D),
                        ),
                      ),
                    ),
                  ),
                ),
                Expanded(
                  child: GestureDetector(
                    onTap: () => setState(() => _kind = 'body_composition'),
                    child: Container(
                      padding: const EdgeInsets.symmetric(vertical: 9),
                      alignment: Alignment.center,
                      decoration: BoxDecoration(
                        color: _kind == 'body_composition' ? const Color(0xFF0D5C46) : Colors.transparent,
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        'Body composition',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w800,
                          color: _kind == 'body_composition' ? Colors.white : const Color(0xFF52605D),
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 14),

          // Form fields
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: const Color(0xFFDCE9E5)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Report title',
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: Color(0xFF17222B)),
                ),
                const SizedBox(height: 6),
                TextField(
                  controller: _titleController,
                  style: const TextStyle(fontSize: 13, color: Color(0xFF17222B)),
                  decoration: InputDecoration(
                    hintText: 'e.g. Complete Blood Count (CBC)',
                    hintStyle: const TextStyle(fontSize: 12.5, color: Color(0xFF879590)),
                    filled: true,
                    fillColor: Colors.white,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(6),
                      borderSide: const BorderSide(color: Color(0xFFD9E4E1)),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(6),
                      borderSide: const BorderSide(color: Color(0xFFD9E4E1)),
                    ),
                  ),
                ),
                const SizedBox(height: 14),
                const Text(
                  'Laboratory / Diagnostic center',
                  style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800, color: Color(0xFF17222B)),
                ),
                const SizedBox(height: 6),
                TextField(
                  controller: _labController,
                  style: const TextStyle(fontSize: 13, color: Color(0xFF17222B)),
                  decoration: InputDecoration(
                    hintText: 'e.g. Metropolis Healthcare or Quest Diagnostics',
                    hintStyle: const TextStyle(fontSize: 12.5, color: Color(0xFF879590)),
                    filled: true,
                    fillColor: Colors.white,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(6),
                      borderSide: const BorderSide(color: Color(0xFFD9E4E1)),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(6),
                      borderSide: const BorderSide(color: Color(0xFFD9E4E1)),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 18),

          // Processing indicator
          if (_isProcessing) ...[
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: const Color(0xFFEAF9F2),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: const Color(0xFFBFE9DF)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const SizedBox(
                        height: 16,
                        width: 16,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Color(0xFF087766)),
                      ),
                      const SizedBox(width: 10),
                      Text(
                        _processingStep,
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w800,
                          color: Color(0xFF087766),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(
                      value: _processingProgress,
                      backgroundColor: Colors.white,
                      valueColor: const AlwaysStoppedAnimation<Color>(Color(0xFF0A7D6E)),
                      minHeight: 5,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 18),
          ],

          // Submit button
          ElevatedButton(
            onPressed: _isProcessing ? null : _handleUploadAndAnalyze,
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF0A7D6E),
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            child: const Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.auto_awesome_rounded, size: 18, color: Colors.white),
                SizedBox(width: 8),
                Text(
                  'Upload & Analyze with AI',
                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _showPickerSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                ListTile(
                  leading: const Icon(Icons.camera_alt_outlined, color: Color(0xFF0A7D6E)),
                  title: const Text('Take Camera Photo', style: TextStyle(fontWeight: FontWeight.w700)),
                  onTap: () {
                    Navigator.pop(ctx);
                    _pickImage(ImageSource.camera);
                  },
                ),
                ListTile(
                  leading: const Icon(Icons.photo_library_outlined, color: Color(0xFF0A7D6E)),
                  title: const Text('Choose Photo from Gallery', style: TextStyle(fontWeight: FontWeight.w700)),
                  onTap: () {
                    Navigator.pop(ctx);
                    _pickImage(ImageSource.gallery);
                  },
                ),
                ListTile(
                  leading: const Icon(Icons.picture_as_pdf_outlined, color: Color(0xFF0A7D6E)),
                  title: const Text('Select PDF Document', style: TextStyle(fontWeight: FontWeight.w700)),
                  onTap: () {
                    Navigator.pop(ctx);
                    _pickFile();
                  },
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
