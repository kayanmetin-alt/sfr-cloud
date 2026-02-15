//
//  SettingsView.swift
//  SifreKasasiCloud
//

import SwiftUI

struct SettingsView: View {
    var onDismiss: () -> Void
    @State private var prefs = SettingsDTO(keepOldPasswords: false, maskInList: true, securityLockEnabled: false, autoLockEnabled: true)
    @State private var showChangePassword = false
    @State private var showDeleteAccount = false
    @State private var currentPassword = ""
    @State private var newPassword = ""
    @State private var newPasswordConfirm = ""
    @State private var deletePassword = ""
    @State private var message = ""
    @State private var loading = false
    @StateObject private var app = AppState.shared

    var body: some View {
        NavigationStack {
            Form {
                Section("Tercihler") {
                    Toggle("Eski şifreleri sakla", isOn: $prefs.keepOldPasswords)
                    Toggle("Listede şifreleri maskele", isOn: $prefs.maskInList)
                    Toggle("Güvenlik kilidi (5 yanlışta kilit)", isOn: $prefs.securityLockEnabled)
                    Toggle("Otomatik kilitleme", isOn: $prefs.autoLockEnabled)
                }
                Section("Parola") {
                    Button("Ana parolamı değiştir") {
                        showChangePassword = true
                    }
                }
                Section("Destek") {
                    Link("İletişim / Destek", destination: URL(string: "mailto:metin_kayan@icloud.com")!)
                    Link("Gizlilik politikası", destination: URL(string: "https://sites.google.com/view/storekey-privacy")!)
                }
                Section {
                    Button("Hesabımı ve verileri sil", role: .destructive) {
                        showDeleteAccount = true
                    }
                }
            }
            .navigationTitle("Ayarlar")
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Bitti") {
                        Task { await savePrefs() }
                        onDismiss()
                    }
                }
            }
            .onAppear {
                Task {
                    do {
                        let s = try await SettingsAPI.get()
                        await MainActor.run { prefs = s }
                    } catch { }
                }
            }
            .sheet(isPresented: $showChangePassword) {
                changePasswordSheet
            }
            .sheet(isPresented: $showDeleteAccount) {
                deleteAccountSheet
            }
        }
    }

    private var changePasswordSheet: some View {
        NavigationStack {
            Form {
                SecureField("Mevcut parola", text: $currentPassword)
                SecureField("Yeni parola", text: $newPassword)
                SecureField("Yeni parola (tekrar)", text: $newPasswordConfirm)
                if !message.isEmpty { Text(message).foregroundStyle(.red) }
                Button("Parolayı güncelle") {
                    Task { await changePassword() }
                }
                .disabled(loading || currentPassword.isEmpty || newPassword.isEmpty || newPassword != newPasswordConfirm)
            }
            .navigationTitle("Parola değiştir")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("İptal") {
                        showChangePassword = false
                        message = ""
                    }
                }
            }
        }
    }

    private var deleteAccountSheet: some View {
        NavigationStack {
            Form {
                Text("Bu işlem geri alınamaz. Tüm şifreleriniz kalıcı olarak silinecektir. Onay için parolanızı girin.")
                    .font(.caption)
                SecureField("Parolanız", text: $deletePassword)
                if !message.isEmpty { Text(message).foregroundStyle(.red) }
                Button("Hesabımı sil", role: .destructive) {
                    Task { await deleteAccount() }
                }
                .disabled(loading || deletePassword.isEmpty)
            }
            .navigationTitle("Hesabı sil")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Vazgeç") {
                        showDeleteAccount = false
                        message = ""
                    }
                }
            }
        }
    }

    private func savePrefs() async {
        do {
            try await SettingsAPI.update(prefs)
        } catch { }
    }

    private func changePassword() async {
        message = ""
        if newPassword.count < 8 {
            message = "Parola en az 8 karakter olmalı."
            return
        }
        loading = true
        defer { loading = false }
        do {
            try await CloudAuthService.changePassword(currentPassword: currentPassword, newPassword: newPassword)
            showChangePassword = false
            currentPassword = ""
            newPassword = ""
            newPasswordConfirm = ""
        } catch {
            message = error.localizedDescription
        }
    }

    private func deleteAccount() async {
        message = ""
        loading = true
        defer { loading = false }
        do {
            try await CloudAuthService.deleteAccount(password: deletePassword)
            app.logout()
            showDeleteAccount = false
            onDismiss()
        } catch {
            message = error.localizedDescription
        }
    }
}
