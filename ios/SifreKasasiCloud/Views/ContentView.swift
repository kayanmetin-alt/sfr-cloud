//
//  ContentView.swift
//  SifreKasasiCloud
//

import SwiftUI

struct ContentView: View {
    @StateObject private var app = AppState.shared

    var body: some View {
        Group {
            if !app.isLoggedIn {
                LoginView()
            } else if !app.isUnlocked {
                UnlockView()
            } else {
                VaultListView()
            }
        }
        .animation(.easeInOut, value: app.isLoggedIn)
        .animation(.easeInOut, value: app.isUnlocked)
    }
}
