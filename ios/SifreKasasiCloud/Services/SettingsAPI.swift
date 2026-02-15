//
//  SettingsAPI.swift
//  SifreKasasiCloud
//

import Foundation

struct SettingsDTO: Codable {
    var keepOldPasswords: Bool
    var maskInList: Bool
    var securityLockEnabled: Bool
    var autoLockEnabled: Bool
}

enum SettingsAPI {
    static func get() async throws -> SettingsDTO {
        try await APIClient.shared.request("/api/settings")
    }

    static func update(_ s: SettingsDTO) async throws {
        struct Body: Encodable {
            let keepOldPasswords: Bool
            let maskInList: Bool
            let securityLockEnabled: Bool
            let autoLockEnabled: Bool
        }
        let b = Body(keepOldPasswords: s.keepOldPasswords, maskInList: s.maskInList, securityLockEnabled: s.securityLockEnabled, autoLockEnabled: s.autoLockEnabled)
        try await APIClient.shared.requestVoid("/api/settings", method: "PUT", body: b)
    }
}
