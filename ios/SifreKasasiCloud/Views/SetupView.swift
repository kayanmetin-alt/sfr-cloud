//
//  SetupView.swift
//  SifreKasasiCloud
//

import SwiftUI

struct SetupView: View {
    @Binding var showSetup: Bool
    @State private var email = ""
    @State private var password = ""
    @State private var confirm = ""
    @State private var recoveryQuestion = ""
    @State private var recoveryAnswer = ""
    @State private var error = ""
    @State private var loading = false
    @StateObject private var app = AppState.shared

    var body: some View {
        NavigationStack {
            ZStack {
                Color(red: 0.04, green: 0.05, blue: 0.07)
                    .ignoresSafeArea()
                Form {
                    Section {
                        TextField("E-posta", text: $email)
                            .textContentType(.emailAddress)
                            .autocapitalization(.none)
                            .keyboardType(.emailAddress)
                        SecureField("Ana parola", text: $password)
                            .textContentType(.newPassword)
                        SecureField("Parola (tekrar)", text: $confirm)
                            .textContentType(.newPassword)
                    } header: {
                        Text("Hesap")
                    }
                    Section {
                        TextField("Güvenlik sorusu", text: $recoveryQuestion)
                        TextField("Cevabı", text: $recoveryAnswer)
                    } header: {
                        Text("Kurtarma")
                    }
                    Section {
                        if !error.isEmpty {
                            Text(error)
                                .foregroundStyle(.red)
                        }
                        Button("Kasanı oluştur") {
                            Task { await register() }
                        }
                        .frame(maxWidth: .infinity)
                        .disabled(loading)
                    }
                }
                .scrollContentBackground(.hidden)
            }
            .navigationTitle("Kurulum")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Geri") {
                        showSetup = false
                    }
                }
            }
        }
    }

    private func register() async {
        error = ""
        if password != confirm {
            error = "Parolalar eşleşmiyor."
            return
        }
        if password.count < 8 {
            error = "Parola en az 8 karakter olmalı."
            return
        }
        if recoveryQuestion.isEmpty || recoveryAnswer.isEmpty {
            error = "Güvenlik sorusu ve cevabı girin."
            return
        }
        loading = true
        defer { loading = false }
        do {
            _ = try await CloudAuthService.register(
                email: email.trimmingCharacters(in: .whitespaces),
                password: password,
                recoveryQuestion: recoveryQuestion.trimmingCharacters(in: .whitespaces),
                recoveryAnswer: recoveryAnswer.trimmingCharacters(in: .whitespaces)
            )
            try await app.unlock(password: password)
            app.setEmail(KeychainHelper.shared.getEmail())
            showSetup = false
        } catch let e as APIError {
            error = e.localizedDescription
        } catch {
            error = error.localizedDescription
        }
    }
}
