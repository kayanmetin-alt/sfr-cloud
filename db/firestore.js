import admin from 'firebase-admin';

const USERS = 'users';
const SETTINGS = 'user_settings';
const RECORDS = 'password_records';

let firestore;

export async function init() {
  const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!key) throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY env required for Firestore');
  const cred = JSON.parse(key);
  if (!admin.apps.length) {
    admin.initializeApp({ credential: admin.credential.cert(cred) });
  }
  firestore = admin.firestore();
}

const toUser = (id, d) => d ? { id, ...d } : null;
const toSettings = (d) => d ? { userId: d.user_id, keep_old_passwords: d.keep_old_passwords, mask_in_list: d.mask_in_list, security_lock_enabled: d.security_lock_enabled, auto_lock_enabled: d.auto_lock_enabled } : null;
const toRecord = (id, d) => d ? { id, siteName: d.site_name, encryptedData: d.encrypted_data, updatedAt: d.updated_at, pastEncrypted: d.past_encrypted || [], sortOrder: d.sort_order ?? 0 } : null;

export const db = {
  async createUser(data) {
    await firestore.collection(USERS).doc(data.id).set({
      email: data.email,
      password_hash: data.passwordHash,
      salt: data.salt,
      recovery_question: data.recoveryQuestion,
      recovery_answer_hash: data.recoveryAnswerHash,
      recovery_encrypted_key: data.recoveryEncryptedKey ?? null,
      created_at: data.createdAt,
    });
  },

  async getUserByEmail(email) {
    const snap = await firestore.collection(USERS).where('email', '==', email).limit(1).get();
    if (snap.empty) return null;
    const doc = snap.docs[0];
    return toUser(doc.id, doc.data());
  },

  async getUserById(id) {
    const doc = await firestore.collection(USERS).doc(id).get();
    return toUser(id, doc.exists ? doc.data() : null);
  },

  async updateUser(id, data) {
    const ref = firestore.collection(USERS).doc(id);
    const upd = {};
    if (data.password_hash !== undefined) upd.password_hash = data.password_hash;
    if (data.totp_secret !== undefined) upd.totp_secret = data.totp_secret;
    if (data.pending_totp_secret !== undefined) upd.pending_totp_secret = data.pending_totp_secret;
    if (data.recovery_encrypted_key !== undefined) upd.recovery_encrypted_key = data.recovery_encrypted_key;
    if (Object.keys(upd).length) await ref.update(upd);
  },

  async deleteUser(id) {
    const batch = firestore.batch();
    const recs = await firestore.collection(RECORDS).where('user_id', '==', id).get();
    recs.docs.forEach(d => batch.delete(d.ref));
    const setRef = firestore.collection(SETTINGS).doc(id);
    batch.delete(setRef);
    batch.delete(firestore.collection(USERS).doc(id));
    await batch.commit();
  },

  async createDefaultSettings(userId) {
    const ref = firestore.collection(SETTINGS).doc(userId);
    const snap = await ref.get();
    if (!snap.exists) {
      await ref.set({
        keep_old_passwords: 0,
        mask_in_list: 1,
        security_lock_enabled: 0,
        auto_lock_enabled: 1,
      });
    }
  },

  async getSettings(userId) {
    const doc = await firestore.collection(SETTINGS).doc(userId).get();
    if (!doc.exists) return null;
    const d = doc.data();
    return {
      user_id: userId,
      keep_old_passwords: d.keep_old_passwords,
      mask_in_list: d.mask_in_list,
      security_lock_enabled: d.security_lock_enabled,
      auto_lock_enabled: d.auto_lock_enabled,
    };
  },

  async upsertSettings(userId, prefs) {
    await firestore.collection(SETTINGS).doc(userId).set({
      keep_old_passwords: prefs.keepOldPasswords ? 1 : 0,
      mask_in_list: prefs.maskInList ? 1 : 0,
      security_lock_enabled: prefs.securityLockEnabled ? 1 : 0,
      auto_lock_enabled: prefs.autoLockEnabled ? 1 : 0,
    }, { merge: true });
  },

  async getRecordsByUserId(userId) {
    const snap = await firestore.collection(RECORDS).where('user_id', '==', userId).orderBy('sort_order').get();
    return snap.docs.map(d => toRecord(d.id, d.data()));
  },

  async getMaxSortOrder(userId) {
    const snap = await firestore.collection(RECORDS).where('user_id', '==', userId).orderBy('sort_order', 'desc').limit(1).get();
    if (snap.empty) return 0;
    return (snap.docs[0].data().sort_order ?? 0) + 1;
  },

  async createRecord(data) {
    await firestore.collection(RECORDS).doc(data.id).set({
      user_id: data.userId,
      site_name: data.siteName,
      encrypted_data: data.encryptedData,
      updated_at: data.updatedAt,
      past_encrypted: data.pastEncrypted || [],
      sort_order: data.sortOrder ?? 0,
    });
  },

  async getRecordByIdAndUser(id, userId) {
    const doc = await firestore.collection(RECORDS).doc(id).get();
    if (!doc.exists) return null;
    const d = doc.data();
    if (d.user_id !== userId) return null;
    return toRecord(id, d);
  },

  async updateRecord(id, userId, data) {
    const ref = firestore.collection(RECORDS).doc(id);
    const doc = await ref.get();
    if (!doc.exists || doc.data().user_id !== userId) return;
    await ref.update({
      site_name: data.siteName,
      encrypted_data: data.encryptedData,
      updated_at: data.updatedAt,
      past_encrypted: Array.isArray(data.pastEncrypted) ? data.pastEncrypted : [],
      sort_order: data.sortOrder ?? 0,
    });
  },

  async deleteRecord(id, userId) {
    const ref = firestore.collection(RECORDS).doc(id);
    const doc = await ref.get();
    if (!doc.exists || doc.data().user_id !== userId) return false;
    await ref.delete();
    return true;
  },

  async reorderRecords(userId, orderedIds) {
    const batch = firestore.batch();
    for (let i = 0; i < orderedIds.length; i++) {
      const ref = firestore.collection(RECORDS).doc(orderedIds[i]);
      const doc = await ref.get();
      if (doc.exists && doc.data().user_id === userId) {
        batch.update(ref, { sort_order: i });
      }
    }
    await batch.commit();
  },
};
