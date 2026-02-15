//
//  AppState.swift
//  SifreKasasiCloud
//

import Foundation
import CryptoKit

@MainActor
final class AppState: ObservableObject {
    static let shared = AppState()

    @Published private(set) var email: String?
    @Published private(set) var cryptoKey: SymmetricKey?
    @Published var isLoading = false
    @Published var errorMessage: String?

    var token: String? { APIClient.shared.token }
    var isLoggedIn: Bool { token != nil }
    var isUnlocked: Bool { cryptoKey != nil }

    private init() {
        self.email = KeychainHelper.shared.getEmail()
    }

    func setUnlocked(key: SymmetricKey) {
        self.cryptoKey = key
    }

    func setEmail(_ value: String?) {
        self.email = value
    }

    func unlock(password: String) async throws {
        let salt = KeychainHelper.shared.getSalt()
        let key = try CloudCrypto.deriveKey(password: password, saltFromServer: salt)
        self.cryptoKey = key
    }

    func lock() {
        self.cryptoKey = nil
    }

    func logout() {
        CloudAuthService.logout()
        self.cryptoKey = nil
        self.email = nil
    }

    func setError(_ message: String?) {
        self.errorMessage = message
    }
}
