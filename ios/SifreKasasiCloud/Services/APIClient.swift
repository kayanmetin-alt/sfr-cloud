//
//  APIClient.swift
//  SifreKasasiCloud
//

import Foundation

enum APIError: LocalizedError {
    case invalidURL
    case noData
    case serverError(String)
    case unauthorized

    var errorDescription: String? {
        switch self {
        case .invalidURL: return "Geçersiz adres"
        case .noData: return "Yanıt alınamadı"
        case .serverError(let msg): return msg
        case .unauthorized: return "Oturum süresi doldu"
        }
    }
}

final class APIClient {
    static let shared = APIClient()
    private let baseURL: String
    private let session: URLSession

    private init() {
        self.baseURL = AppConfig.apiBaseURL
        self.session = URLSession.shared
    }

    var token: String? {
        get { KeychainHelper.shared.getToken() }
        set { if let v = newValue { KeychainHelper.shared.saveToken(v) } else { KeychainHelper.shared.deleteToken() } }
    }

    func url(path: String) -> URL? {
        let s = baseURL.hasSuffix("/") ? baseURL.dropLast() : baseURL
        return URL(string: "\(s)\(path)")
    }

    func request<T: Decodable>(_ path: String, method: String = "GET", body: Encodable? = nil, auth: Bool = true) async throws -> T {
        guard let url = url(path: path) else { throw APIError.invalidURL }
        var req = URLRequest(url: url)
        req.httpMethod = method
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if auth, let t = token {
            req.setValue("Bearer \(t)", forHTTPHeaderField: "Authorization")
        }
        if let b = body {
            req.httpBody = try JSONEncoder().encode(AnyEncodable(b))
        }
        let (data, res) = try await session.data(for: req)
        guard let http = res as? HTTPURLResponse else { throw APIError.noData }
        if http.statusCode == 401 { throw APIError.unauthorized }
        if http.statusCode >= 400 {
            let msg = (try? JSONDecoder().decode([String: String].self, from: data))?["error"] ?? "Hata"
            throw APIError.serverError(msg)
        }
        if T.self == EmptyResponse.self { return EmptyResponse() as! T }
        return try JSONDecoder().decode(T.self, from: data)
    }

    func requestVoid(_ path: String, method: String = "GET", body: Encodable? = nil, auth: Bool = true) async throws {
        let _: EmptyResponse = try await request(path, method: method, body: body, auth: auth)
    }
}

struct EmptyResponse: Codable {}

private struct AnyEncodable: Encodable {
    let value: Encodable
    init(_ value: Encodable) { self.value = value }
    func encode(to encoder: Encoder) throws { try value.encode(to: encoder) }
}
