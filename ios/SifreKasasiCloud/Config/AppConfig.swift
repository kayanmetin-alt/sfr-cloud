//
//  AppConfig.swift
//  SifreKasasiCloud
//

import Foundation

enum AppConfig {
    /// API base URL. Geliştirme: http://localhost:3001. Canlı: Oracle VM adresiniz (örn. http://PUBLIC_IP:3001).
    static var apiBaseURL: String {
        ProcessInfo.processInfo.environment["API_BASE_URL"] ?? "http://localhost:3001"
    }
}
