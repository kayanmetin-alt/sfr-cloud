//
//  AddEntryView.swift
//  SifreKasasiCloud
//

import SwiftUI
import CryptoKit

struct AddEntryView: View {
    var onDismiss: () -> Void
    @State private var siteName = ""
    @State private var password = ""
    @State private var error = ""
    @State private var loading = false
    @State private var showPassword = false
    @StateObject private var app = AppState.shared

    var body: some View {
        NavigationStack {
            Form {
                Section("Bilgiler") {
                    TextField("Site / uygulama adı", text: $siteName)
                        .textContentType(.username)
                    if showPassword {
                        TextField("Şifre", text: $password)
                            .textContentType(.password)
                    } else {
                        SecureField("Şifre", text: $password)
                            .textContentType(.password)
                    }
                    Toggle("Şifreyi göster", isOn: $showPassword)
                }
                if !error.isEmpty {
                    Section {
                        Text(error)
                            .foregroundStyle(.red)
                    }
                }
                Section {
                    Button("Kaydet") {
                        Task { await save() }
                    }
                    .frame(maxWidth: .infinity)
                    .disabled(loading || siteName.trimmingCharacters(in: .whitespaces).isEmpty || password.isEmpty)
                }
            }
            .navigationTitle("Yeni kayıt")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Vazgeç") {
                        onDismiss()
                    }
                    .foregroundStyle(.red)
                }
            }
        }
    }

    private func save() async {
        error = ""
        guard let key = app.cryptoKey else { return }
        loading = true
        defer { loading = false }
        do {
            let enc = try CloudCrypto.encrypt(plainText: password, key: key)
            _ = try await VaultAPI.create(siteName: siteName.trimmingCharacters(in: .whitespaces), encryptedData: enc)
            onDismiss()
        } catch {
            self.error = error.localizedDescription
        }
    }
}
