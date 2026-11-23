import 'package:dio/dio.dart';
import 'package:image_picker/image_picker.dart';

import 'config.dart';

/// An error the user can read: the server's message, or a network problem.
class ApiException implements Exception {
  ApiException(this.message, {this.status});
  final String message;
  final int? status;

  bool get unauthorized => status == 401;

  @override
  String toString() => message;
}

/// What the API client needs from the session.
abstract class ApiAuth {
  String? get token;
  String get locale;
  void onUnauthorized();
}

/// Thin wrapper around Dio for the Krishi API: adds the session token and the
/// app language, turns errors into [ApiException], and uploads photos.
class Api {
  Api(this._auth) {
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) {
          final token = _auth.token;
          if (token != null) options.headers['Authorization'] = 'Bearer $token';
          options.headers['Accept-Language'] = _auth.locale;
          // Sign-in routes return a token (not a cookie) to the app.
          options.headers['X-Krishi-Client'] = 'mobile';
          handler.next(options);
        },
      ),
    );
  }

  final ApiAuth _auth;
  final Dio _dio = Dio(
    BaseOptions(
      baseUrl: AppConfig.apiBaseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 30),
      sendTimeout: const Duration(seconds: 60),
    ),
  );

  /// Downloads a file (e.g. a PDF statement) as bytes.
  Future<List<int>> download(String path, {Map<String, dynamic>? query}) async {
    try {
      final res = await _dio.get<List<int>>(path, queryParameters: query, options: Options(responseType: ResponseType.bytes));
      return res.data ?? const [];
    } on DioException catch (e) {
      final status = e.response?.statusCode;
      if (status == 401) _auth.onUnauthorized();
      throw ApiException(status == null ? 'network' : 'Download failed ($status)', status: status);
    }
  }

  Future<Map<String, dynamic>> get(String path, {Map<String, dynamic>? query}) =>
      _send(() => _dio.get(path, queryParameters: query));

  Future<Map<String, dynamic>> post(String path, [Object? body]) =>
      _send(() => _dio.post(path, data: body ?? const {}));

  Future<Map<String, dynamic>> put(String path, [Object? body]) =>
      _send(() => _dio.put(path, data: body ?? const {}));

  Future<Map<String, dynamic>> patch(String path, [Object? body]) =>
      _send(() => _dio.patch(path, data: body ?? const {}));

  /// Multipart form with optional photos. Null or empty fields are skipped;
  /// a list value is sent as repeated fields (e.g. animal_ids).
  Future<Map<String, dynamic>> postForm(
    String path,
    Map<String, Object?> fields, {
    Map<String, XFile?> files = const {},
  }) async {
    final form = FormData();
    fields.forEach((key, value) {
      if (value == null) return;
      if (value is List) {
        for (final v in value) {
          form.fields.add(MapEntry(key, '$v'));
        }
      } else if ('$value'.isNotEmpty) {
        form.fields.add(MapEntry(key, '$value'));
      }
    });
    for (final entry in files.entries) {
      final file = entry.value;
      if (file == null) continue;
      final name = file.name.toLowerCase();
      final subtype = name.endsWith('.png')
          ? 'png'
          : name.endsWith('.webp')
              ? 'webp'
              : 'jpeg';
      form.files.add(MapEntry(
        entry.key,
        await MultipartFile.fromFile(
          file.path,
          filename: file.name,
          contentType: DioMediaType('image', subtype),
        ),
      ));
    }
    return _send(() => _dio.post(path, data: form));
  }

  Future<Map<String, dynamic>> _send(Future<Response<dynamic>> Function() call) async {
    try {
      final res = await call();
      final data = res.data;
      if (data is Map<String, dynamic>) return data;
      return {'data': data};
    } on DioException catch (e) {
      final status = e.response?.statusCode;
      final data = e.response?.data;
      final serverMessage = data is Map && data['error'] is String ? data['error'] as String : null;
      if (status == 401) _auth.onUnauthorized();
      if (serverMessage != null) throw ApiException(serverMessage, status: status);
      if (status != null) throw ApiException('Something went wrong ($status)', status: status);
      throw ApiException('network', status: null);
    }
  }
}
