//
//  UnlockView.swift
//  SifreKasasiCloud
//

import SwiftUI

struct UnlockView: View {
    @State private var password = ""
    @State private var error = ""
    @State private var loading = false
    @StateObject private var app = AppState.shared

    var body: some View {
        ZStack {
            Color(red: 0.04, green: 0.05, blue: 0.07)
                .ignoresSafeArea()
            VStack(spacing: 24) {
                Image(systemName: "lock.shield.fill")
                    .font(.system(size: 64))
                    .foregroundStyle(.indigo.opacity(0.9))
                Text("Kasa kilitli")
                    .font(.title2.bold())
                    .foregroundStyle(.white)
                if let email = app.email {
                    Text(email)
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                }
                SecureField("Parola", text: $password)
                    .textContentType(.password)
                    .padding()
                    .background(Color(.systemGray6))
                    .cornerRadius(12)
                    .padding(.horizontal, 40)
                if !error.isEmpty {
                    Text(error)
                        .font(.caption)
                        .foregroundStyle(.red)
                }
                Button {
                    Task { await unlock() }
                } label: {
                    Text(loading ? "Açılıyor…" : "Giriş Yap")
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.indigo)
                        .foregroundStyle(.white)
                        .cornerRadius(12)
                }
                .padding(.horizontal, 40)
                .disabled(loading)
            }
        }
    }

    private func unlock() async {
        error = ""
        guard !password.isEmpty else {
            error = "Parola girin."
            return
        }
        loading = true
        defer { loading = false }
        do {
            try await app.unlock(password: password)
        } catch {
            error = error.localizedDescription
        }
    }
}
