//
//  CloudCrypto.swift
//  SifreKasasiCloud
//

import Foundation
import CryptoKit
import CommonCrypto

/// Web ile uyumlu: PBKDF2 120000, SHA256, 32 byte key, AES-GCM 12 byte IV, 128 bit tag
enum CloudCrypto {
    private static let iterations = 120_000
    private static let keyByteCount = 32
    private static let ivByteCount = 12

    static func saltToData(_ saltFromServer: String?) -> Data {
        guard let s = saltFromServer, !s.isEmpty else { return Data(count: 16) }
        if s.count == 32, s.unicodeScalars.allSatisfy({ $0.isHexDigit }) {
            return Data(hexString: s)
        }
        if let data = Data(base64Encoded: s) { return data }
        return Data(s.utf8.prefix(16))
    }

    static func deriveKey(password: String, saltFromServer: String?) throws -> SymmetricKey {
        let salt = saltToData(saltFromServer)
        let passwordData = Data(password.utf8)
        let key = pbkdf2(password: passwordData, salt: salt, keyLength: keyByteCount)
        return SymmetricKey(data: key)
    }

    static func encrypt(plainText: String, key: SymmetricKey) throws -> String {
        let data = Data(plainText.utf8)
        let iv = Data((0..<ivByteCount).map { _ in UInt8.random(in: 0...255) })
        let sealed = try AES.GCM.seal(data, using: key, nonce: AES.GCM.Nonce(data: iv))
        guard let combined = sealed.combined else { throw CloudCryptoError.encryptionFailed }
        return combined.base64EncodedString()
    }

    static func decrypt(base64Cipher: String, key: SymmetricKey) throws -> String {
        guard let combined = Data(base64Encoded: base64Cipher), combined.count >= ivByteCount + 16 else {
            throw CloudCryptoError.invalidCipher
        }
        let sealed = try AES.GCM.SealedBox(combined: combined)
        let dec = try AES.GCM.open(sealed, using: key)
        guard let s = String(data: dec, encoding: .utf8) else { throw CloudCryptoError.decryptionFailed }
        return s
    }

    private static func pbkdf2(password: Data, salt: Data, keyLength: Int) -> Data {
        var result = [UInt8](repeating: 0, count: keyLength)
        result.withUnsafeMutableBytes { out in
            password.withUnsafeBytes { p in
                salt.withUnsafeBytes { s in
                    CCKeyDerivationPBKDF(
                        CCPBKDFAlgorithm(kCCPBKDF2),
                        p.baseAddress?.assumingMemoryBound(to: Int8.self),
                        password.count,
                        s.baseAddress?.assumingMemoryBound(to: UInt8.self),
                        salt.count,
                        CCPBKDFAlgorithm(kCCPRFHmacAlgSHA256),
                        UInt32(iterations),
                        out.baseAddress?.assumingMemoryBound(to: UInt8.self),
                        keyLength
                    )
                }
            }
        }
        return Data(result)
    }
}

enum CloudCryptoError: LocalizedError {
    case encryptionFailed
    case decryptionFailed
    case invalidCipher
    var errorDescription: String? {
        switch self {
        case .encryptionFailed: return "Şifreleme başarısız"
        case .decryptionFailed: return "Şifre çözme başarısız"
        case .invalidCipher: return "Geçersiz şifreli veri"
        }
    }
}

extension Data {
    init?(hexString: String) {
        let len = hexString.count / 2
        var data = Data(capacity: len)
        var i = hexString.startIndex
        for _ in 0..<len {
            let j = hexString.index(i, offsetBy: 2)
            guard let byte = UInt8(hexString[i..<j], radix: 16) else { return nil }
            data.append(byte)
            i = j
        }
        self = data
    }
}
