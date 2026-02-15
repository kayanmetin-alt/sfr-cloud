//
//  RecoveryView.swift
//  SifreKasasiCloud
//

import SwiftUI

struct RecoveryView: View {
    @Environment(\.dismiss) var dismiss
    @State private var step = 1
    @State private var email = ""
    @State private var question = ""
    @State private var answer = ""
    @State private var newPassword = ""
    @State private var newPasswordConfirm = ""
    @State private var userId: String?
    @State private var error = ""
    @State private var loading = false
    @State private var success = false
    @StateObject private var app = AppState.shared

    var body: some View {
        NavigationStack {
            ZStack {
                Color(red: 0.04, green: 0.05, blue: 0.07)
                    .ignoresSafeArea()
                ScrollView {
                    VStack(spacing: 20) {
                        if success {
                            Image(systemName: "checkmark.circle.fill")
                                .font(.largeTitle)
                                .foregroundStyle(.green)
                            Text("Parola sıfırlandı")
                                .font(.headline)
                            Text("Giriş ekranına yönlendiriliyorsunuz…")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        } else if step == 1 {
                            Text("E-posta adresinizi girin")
                                .font(.subheadline)
                                .foregroundStyle(.secondary)
                            TextField("E-posta", text: $email)
                                .textContentType(.emailAddress)
                                .autocapitalization(.none)
                                .keyboardType(.emailAddress)
                                .padding()
                                .background(Color(.systemGray6))
                                .cornerRadius(12)
                        } else if step == 2 {
                            Text(question.isEmpty ? "Güvenlik sorusu" : question)
                                .font(.headline)
                                .foregroundStyle(.white)
                                .multilineTextAlignment(.center)
                            TextField("Cevabınız", text: $answer)
                                .padding()
                                .background(Color(.systemGray6))
                                .cornerRadius(12)
                        } else {
                            SecureField("Yeni parola", text: $newPassword)
                                .textContentType(.newPassword)
                                .padding()
                                .background(Color(.systemGray6))
                                .cornerRadius(12)
                            SecureField("Yeni parola (tekrar)", text: $newPasswordConfirm)
                                .textContentType(.newPassword)
                                .padding()
                                .background(Color(.systemGray6))
                                .cornerRadius(12)
                        }
                        if !error.isEmpty {
                            Text(error)
                                .font(.caption)
                                .foregroundStyle(.red)
                        }
                        if !success {
                            HStack(spacing: 12) {
                                if step > 1 {
                                    Button("Geri") {
                                        step -= 1
                                        error = ""
                                    }
                                    .foregroundStyle(.secondary)
                                }
                                Button(step == 1 ? "Devam" : step == 2 ? "Doğrula" : "Parolayı sıfırla") {
                                    Task { await next() }
                                }
                                .buttonStyle(.borderedProminent)
                                .tint(.indigo)
                                .disabled(loading)
                            }
                        }
                    }
                    .padding()
                }
            }
            .navigationTitle("Parola sıfırlama")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Geri") {
                        dismiss()
                    }
                }
            }
        }
    }

    private func next() async {
        error = ""
        loading = true
        defer { loading = false }
        do {
            if step == 1 {
                let res = try await CloudAuthService.recoveryQuestion(email: email.trimmingCharacters(in: .whitespaces))
                question = res.recoveryQuestion
                step = 2
            } else if step == 2 {
                let (id, _) = try await CloudAuthService.recoveryVerify(email: email.trimmingCharacters(in: .whitespaces), recoveryAnswer: answer.trimmingCharacters(in: .whitespaces))
                userId = id
                step = 3
            } else {
                guard newPassword == newPasswordConfirm else {
                    error = "Parolalar eşleşmiyor."
                    return
                }
                guard newPassword.count >= 8 else {
                    error = "Parola en az 8 karakter olmalı."
                    return
                }
                guard let uid = userId else { return }
                let res = try await CloudAuthService.recoveryResetPassword(userId: uid, newPassword: newPassword)
                try await app.unlock(password: newPassword)
                app.setEmail(res.email)
                success = true
                DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
                    dismiss()
                }
            }
        } catch let e as APIError {
            error = e.localizedDescription
        } catch {
            error = error.localizedDescription
        }
    }
}
