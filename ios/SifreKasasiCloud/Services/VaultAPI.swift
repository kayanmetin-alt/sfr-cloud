//
//  VaultAPI.swift
//  SifreKasasiCloud
//

import Foundation

enum VaultAPI {
    static func list() async throws -> [PasswordRecordDTO] {
        try await APIClient.shared.request("/api/vault")
    }

    static func create(siteName: String, encryptedData: String, sortOrder: Int? = nil) async throws -> PasswordRecordDTO {
        struct Body: Encodable {
            let siteName: String
            let encryptedData: String
            let sortOrder: Int?
        }
        let b = Body(siteName: siteName, encryptedData: encryptedData, sortOrder: sortOrder)
        return try await APIClient.shared.request("/api/vault", method: "POST", body: b)
    }

    static func update(id: String, siteName: String, encryptedData: String, pastEncrypted: [String], sortOrder: Int) async throws -> PasswordRecordDTO {
        struct Body: Encodable {
            let siteName: String
            let encryptedData: String
            let pastEncrypted: [String]
            let sortOrder: Int
        }
        let b = Body(siteName: siteName, encryptedData: encryptedData, pastEncrypted: pastEncrypted, sortOrder: sortOrder)
        return try await APIClient.shared.request("/api/vault/\(id)", method: "PUT", body: b)
    }

    static func delete(id: String) async throws {
        try await APIClient.shared.requestVoid("/api/vault/\(id)", method: "DELETE")
    }

    static func reorder(orderedIds: [String]) async throws {
        struct Body: Encodable { let orderedIds: [String] }
        try await APIClient.shared.requestVoid("/api/vault/reorder", method: "POST", body: Body(orderedIds: orderedIds))
    }
}
