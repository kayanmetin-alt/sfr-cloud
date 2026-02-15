//
//  AppConfig.swift
//  SifreKasasiCloud
//

import Foundation

enum AppConfig {
    /// API base URL. Değiştirin: kendi sunucunuz veya http://localhost:3001 (simülatör)
    static var apiBaseURL: String {
        ProcessInfo.processInfo.environment["API_BASE_URL"] ?? "http://localhost:3001"
    }
}
