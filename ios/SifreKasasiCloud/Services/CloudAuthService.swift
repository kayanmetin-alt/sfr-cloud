//
//  CloudAuthService.swift
//  SifreKasasiCloud
//

import Foundation

struct LoginResponse: Codable {
    let token: String
    let userId: String
    let email: String
    let salt: String?
}

struct MeResponse: Codable {
    let userId: String
    let email: String
    let salt: String?
}

struct RecoveryQuestionResponse: Codable {
    let recoveryQuestion: String
}

enum CloudAuthService {
    static func register(email: String, password: String, recoveryQuestion: String, recoveryAnswer: String) async throws -> LoginResponse {
        let body: [String: String] = [
            "email": email,
            "password": password,
            "recoveryQuestion": recoveryQuestion,
            "recoveryAnswer": recoveryAnswer
        ]
        let res: LoginResponse = try await APIClient.shared.request("/api/auth/register", method: "POST", body: body, auth: false)
        APIClient.shared.token = res.token
        KeychainHelper.shared.saveEmail(res.email)
        if let s = res.salt { KeychainHelper.shared.saveSalt(s) }
        return res
    }

    static func login(email: String, password: String) async throws -> LoginResponse {
        let body: [String: String] = ["email": email, "password": password]
        let res: LoginResponse = try await APIClient.shared.request("/api/auth/login", method: "POST", body: body, auth: false)
        APIClient.shared.token = res.token
        KeychainHelper.shared.saveEmail(res.email)
        if let s = res.salt { KeychainHelper.shared.saveSalt(s) }
        return res
    }

    static func me() async throws -> MeResponse {
        try await APIClient.shared.request("/api/auth/me")
    }

    static func recoveryQuestion(email: String) async throws -> RecoveryQuestionResponse {
        let encoded = email.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? email
        return try await APIClient.shared.request("/api/auth/recovery/question?email=\(encoded)", auth: false)
    }

    static func recoveryVerify(email: String, recoveryAnswer: String) async throws -> (userId: String, recoveryEncryptedKey: String?) {
        struct R: Codable { let userId: String; let recoveryEncryptedKey: String? }
        let body: [String: String] = ["email": email, "recoveryAnswer": recoveryAnswer]
        let r: R = try await APIClient.shared.request("/api/auth/recovery/verify", method: "POST", body: body, auth: false)
        return (r.userId, r.recoveryEncryptedKey)
    }

    static func recoveryResetPassword(userId: String, newPassword: String) async throws -> LoginResponse {
        let body: [String: String] = ["userId": userId, "newPassword": newPassword]
        let res: LoginResponse = try await APIClient.shared.request("/api/auth/recovery/reset-password", method: "POST", body: body, auth: false)
        APIClient.shared.token = res.token
        KeychainHelper.shared.saveEmail(res.email)
        if let s = res.salt { KeychainHelper.shared.saveSalt(s) }
        return res
    }

    static func changePassword(currentPassword: String, newPassword: String) async throws {
        let body: [String: String] = ["currentPassword": currentPassword, "newPassword": newPassword]
        try await APIClient.shared.requestVoid("/api/auth/me/password", method: "PUT", body: body)
    }

    static func deleteAccount(password: String) async throws {
        let body: [String: String] = ["password": password]
        try await APIClient.shared.requestVoid("/api/auth/me", method: "DELETE", body: body)
    }

    static func logout() {
        APIClient.shared.token = nil
        KeychainHelper.shared.clearAll()
    }
}
