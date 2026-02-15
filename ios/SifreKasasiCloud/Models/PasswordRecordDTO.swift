//
//  PasswordRecordDTO.swift
//  SifreKasasiCloud
//

import Foundation

struct PasswordRecordDTO: Codable, Identifiable {
    let id: String
    var siteName: String
    var encryptedData: String
    var updatedAt: Int64
    var pastEncrypted: [String]
    var sortOrder: Int

    enum CodingKeys: String, CodingKey {
        case id
        case siteName
        case encryptedData
        case updatedAt
        case pastEncrypted
        case sortOrder
    }
}
