//
//  LoginView.swift
//  SifreKasasiCloud
//

import SwiftUI

struct LoginView: View {
    @State private var email = ""
    @State private var password = ""
    @State private var error = ""
    @State private var loading = false
    @State private var showSetup = false
    @State private var showRecovery = false
    @StateObject private var app = AppState.shared

    var body: some View {
        Group {
            if showSetup {
                SetupView(showSetup: $showSetup)
            } else {
                NavigationStack {
                    ZStack {
                        Color(red: 0.04, green: 0.05, blue: 0.07)
                            .ignoresSafeArea()
                        ScrollView {
                            VStack(spacing: 28) {
                                Image(systemName: "lock.shield.fill")
                                    .font(.system(size: 64))
                                    .foregroundStyle(.indigo.opacity(0.9))
                                Text("Şifre Kasası")
                                    .font(.title.bold())
                                    .foregroundStyle(.white)
                                Text("Hesabınıza giriş yapın")
                                    .font(.subheadline)
                                    .foregroundStyle(.secondary)

                                VStack(spacing: 16) {
                                    TextField("E-posta", text: $email)
                                        .textContentType(.emailAddress)
                                        .autocapitalization(.none)
                                        .keyboardType(.emailAddress)
                                        .padding()
                                        .background(Color(.systemGray6))
                                        .cornerRadius(12)
                                    SecureField("Parola", text: $password)
                                        .textContentType(.password)
                                        .padding()
                                        .background(Color(.systemGray6))
                                        .cornerRadius(12)
                                    if !error.isEmpty {
                                        Text(error)
                                            .font(.caption)
                                            .foregroundStyle(.red)
                                    }
                                    Button {
                                        Task { await login() }
                                    } label: {
                                        Text(loading ? "Giriş yapılıyor…" : "Giriş Yap")
                                            .frame(maxWidth: .infinity)
                                            .padding()
                                            .background(Color.indigo)
                                            .foregroundStyle(.white)
                                            .cornerRadius(12)
                                    }
                                    .disabled(loading)
                                    HStack {
                                        Button("Parolamı unuttum") {
                                            showRecovery = true
                                        }
                                        .font(.caption)
                                        .foregroundStyle(.secondary)
                                        Spacer()
                                        Button("Hesap oluştur") {
                                            showSetup = true
                                        }
                                        .font(.caption)
                                        .foregroundStyle(.indigo)
                                    }
                                }
                                .padding(24)
                                .background(Color(.systemGray6).opacity(0.5))
                                .cornerRadius(20)
                            }
                            .padding()
                        }
                    }
                }
                .sheet(isPresented: $showRecovery) {
                    RecoveryView()
                }
            }
        }
    }

    private func login() async {
        error = ""
        guard !email.isEmpty, !password.isEmpty else {
            error = "E-posta ve parola girin."
            return
        }
        loading = true
        defer { loading = false }
        do {
            _ = try await CloudAuthService.login(email: email.trimmingCharacters(in: .whitespaces), password: password)
            try await app.unlock(password: password)
            app.setEmail(KeychainHelper.shared.getEmail())
        } catch let e as APIError {
            error = e.localizedDescription
        } catch let e {
            error = e.localizedDescription
        }
    }
}
