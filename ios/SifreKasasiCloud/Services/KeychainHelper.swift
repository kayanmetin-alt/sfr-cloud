//
//  KeychainHelper.swift
//  SifreKasasiCloud
//

import Foundation
import Security

enum KeychainHelper {
    static let shared = KeychainHelper()
    private let tokenKey = "com.sifrekutusu.cloud.token"
    private let emailKey = "com.sifrekutusu.cloud.email"
    private let saltKey = "com.sifrekutusu.cloud.salt"

    func saveToken(_ value: String) {
        save(key: tokenKey, value: value)
    }
    func getToken() -> String? {
        get(key: tokenKey)
    }
    func deleteToken() {
        delete(key: tokenKey)
    }

    func saveEmail(_ value: String) {
        save(key: emailKey, value: value)
    }
    func getEmail() -> String? {
        get(key: emailKey)
    }

    func saveSalt(_ value: String) {
        save(key: saltKey, value: value)
    }
    func getSalt() -> String? {
        get(key: saltKey)
    }

    private func save(key: String, value: String) {
        guard let data = value.data(using: .utf8) else { return }
        delete(key: key)
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecValueData as String: data,
            kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlockedThisDeviceOnly
        ]
        SecItemAdd(query as CFDictionary, nil)
    }
    private func get(key: String) -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]
        var result: AnyObject?
        guard SecItemCopyMatching(query as CFDictionary, &result) == errSecSuccess,
              let data = result as? Data,
              let s = String(data: data, encoding: .utf8) else { return nil }
        return s
    }
    private func delete(key: String) {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key
        ]
        SecItemDelete(query as CFDictionary)
    }

    func clearAll() {
        delete(key: tokenKey)
        delete(key: emailKey)
        delete(key: saltKey)
    }
}
