//
//  VaultListView.swift
//  SifreKasasiCloud
//

import SwiftUI
import CryptoKit

struct VaultListView: View {
    @State private var records: [PasswordRecordDTO] = []
    @State private var searchText = ""
    @State private var maskInList = true
    @State private var openId: String?
    @State private var loading = true
    @State private var showAdd = false
    @State private var showSettings = false
    @State private var copyToast = false
    @State private var editRecord: PasswordRecordDTO?
    @StateObject private var app = AppState.shared

    private var filtered: [PasswordRecordDTO] {
        if searchText.trimmingCharacters(in: .whitespaces).isEmpty { return records }
        return records.filter { $0.siteName.localizedCaseInsensitiveContains(searchText.trimmingCharacters(in: .whitespaces)) }
    }

    var body: some View {
        NavigationStack {
            ZStack {
                Color(red: 0.04, green: 0.05, blue: 0.07)
                    .ignoresSafeArea()
                VStack(spacing: 0) {
                    if filtered.isEmpty && !loading {
                        ContentUnavailableView(
                            searchText.isEmpty ? "Kasa boş" : "Bulunamadı",
                            systemImage: "magnifyingglass"
                        )
                        .foregroundStyle(.secondary)
                    } else {
                        List {
                            ForEach(filtered) { rec in
                                VaultRowView(
                                    record: rec,
                                    maskInList: maskInList,
                                    openId: $openId,
                                    cryptoKey: app.cryptoKey!,
                                    onCopy: { showCopyToast() },
                                    onEdit: { editRecord = rec },
                                    onDelete: { Task { await deleteRecord(rec.id) } }
                                )
                            }
                        }
                        .listStyle(.plain)
                        .scrollContentBackground(.hidden)
                    }
                }
                if copyToast {
                    VStack {
                        Spacer()
                        HStack {
                            Image(systemName: "checkmark")
                            Text("Kopyalandı")
                        }
                        .padding()
                        .background(.ultraThinMaterial)
                        .cornerRadius(20)
                        .padding(.bottom, 50)
                    }
                }
            }
            .navigationTitle("Şifrelerim")
            .searchable(text: $searchText, prompt: "Ara")
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button {
                        showSettings = true
                    } label: {
                        Image(systemName: "gearshape.fill")
                            .foregroundStyle(.secondary)
                    }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        showAdd = true
                    } label: {
                        Image(systemName: "plus.circle.fill")
                            .font(.title2)
                    }
                }
            }
            .sheet(isPresented: $showAdd) {
                AddEntryView(onDismiss: { showAdd = false; loadRecords() })
            }
            .sheet(isPresented: $showSettings) {
                SettingsView(onDismiss: { showSettings = false; loadRecords() })
            }
            .sheet(item: $editRecord) { rec in
                EditEntryView(record: rec, onDismiss: { editRecord = nil; loadRecords() })
            }
            .onAppear {
                loadRecords()
                loadSettings()
            }
        }
    }

    private func loadRecords() {
        Task {
            do {
                let list = try await VaultAPI.list()
                await MainActor.run { records = list }
            } catch { }
            await MainActor.run { loading = false }
        }
    }

    private func loadSettings() {
        Task {
            do {
                let s = try await SettingsAPI.get()
                await MainActor.run { maskInList = s.maskInList }
            } catch { }
        }
    }

    private func deleteRecord(_ id: String) async {
        do {
            try await VaultAPI.delete(id: id)
            await MainActor.run { records.removeAll { $0.id == id } }
        } catch { }
    }

    private func showCopyToast() {
        copyToast = true
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
            copyToast = false
        }
    }
}

struct VaultRowView: View {
    let record: PasswordRecordDTO
    let maskInList: Bool
    @Binding var openId: String?
    let cryptoKey: SymmetricKey
    let onCopy: () -> Void
    let onEdit: () -> Void
    let onDelete: () -> Void

    @State private var plainPassword: String?
    private var isOpen: Bool { openId == record.id }
    private var showPassword: Bool { !maskInList || isOpen }

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(record.siteName)
                    .font(.headline)
                    .foregroundStyle(.primary)
                Text(showPassword ? (plainPassword ?? "…") : "••••••")
                    .font(.system(.subheadline, design: .monospaced))
                    .foregroundStyle(showPassword ? .indigo : .secondary)
            }
            Spacer()
            Button {
                if let p = plainPassword {
                    UIPasteboard.general.string = p
                    onCopy()
                }
            } label: {
                Image(systemName: "doc.on.doc")
                    .foregroundStyle(.indigo)
            }
            .buttonStyle(.borderless)
            if maskInList {
                Button {
                    openId = isOpen ? nil : record.id
                } label: {
                    Image(systemName: isOpen ? "eye.slash" : "eye")
                        .foregroundStyle(.secondary)
                }
                .buttonStyle(.borderless)
            }
        }
        .contentShape(Rectangle())
        .onChange(of: showPassword) { _, show in
            if show { loadPlain() }
            else { plainPassword = nil }
        }
        .onAppear {
            if showPassword { loadPlain() }
        }
    }

    private func loadPlain() {
        Task {
            do {
                let p = try CloudCrypto.decrypt(base64Cipher: record.encryptedData, key: cryptoKey)
                await MainActor.run { plainPassword = p }
            } catch {
                await MainActor.run { plainPassword = "—" }
            }
        }
    }
}
