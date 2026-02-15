//
//  EditEntryView.swift
//  SifreKasasiCloud
//

import SwiftUI
import CryptoKit

struct EditEntryView: View {
    let record: PasswordRecordDTO
    var onDismiss: () -> Void
    @State private var siteName = ""
    @State private var password = ""
    @State private var error = ""
    @State private var loading = false
    @State private var showPassword = false
    @State private var keepOldPasswords = false
    @StateObject private var app = AppState.shared

    var body: some View {
        NavigationStack {
            Form {
                Section("Bilgiler") {
                    TextField("Site adı", text: $siteName)
                    if showPassword {
                        TextField("Şifre", text: $password)
                    } else {
                        SecureField("Şifre", text: $password)
                    }
                    Toggle("Şifreyi göster", isOn: $showPassword)
                }
                if !record.pastEncrypted.isEmpty {
                    Section("Şifre geçmişi") {
                        ForEach(Array(record.pastEncrypted.enumerated()), id: \.offset) { _, _ in
                            Text("••••••")
                                .font(.system(.caption, design: .monospaced))
                                .foregroundStyle(.secondary)
                        }
                    }
                }
                if !error.isEmpty {
                    Section {
                        Text(error)
                            .foregroundStyle(.red)
                    }
                }
                Section {
                    Button("Güncelle") {
                        Task { await update() }
                    }
                    .frame(maxWidth: .infinity)
                    .disabled(loading || siteName.isEmpty || password.isEmpty)
                }
            }
            .navigationTitle("Düzenle")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("İptal") {
                        onDismiss()
                    }
                }
            }
            .onAppear {
                siteName = record.siteName
                if let key = app.cryptoKey {
                    do {
                        password = try CloudCrypto.decrypt(base64Cipher: record.encryptedData, key: key)
                    } catch { }
                }
            }
        }
    }

    private func update() async {
        error = ""
        guard let key = app.cryptoKey else { return }
        loading = true
        defer { loading = false }
        do {
            let enc = try CloudCrypto.encrypt(plainText: password, key: key)
            var past = record.pastEncrypted
            if keepOldPasswords { past.append(record.encryptedData) }
            _ = try await VaultAPI.update(
                id: record.id,
                siteName: siteName.trimmingCharacters(in: .whitespaces),
                encryptedData: enc,
                pastEncrypted: past,
                sortOrder: record.sortOrder
            )
            onDismiss()
        } catch {
            self.error = error.localizedDescription
        }
    }
}
