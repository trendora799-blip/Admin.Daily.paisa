import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
  tls: true,
  serverSelectionTimeoutMS: 10000,
});

let cachedDb;

async function getDb() {
  if (!cachedDb) {
    await client.connect();
    cachedDb = client.db('daily-paisa');
  }
  return cachedDb;
}

export const db = {
  // USERS
  async getUsers() {
    return (await getDb()).collection('users').find().toArray();
  },
  async findUserById(id) {
    return (await getDb()).collection('users').findOne({ id });
  },
  async updateUser(id, updates) {
    await (await getDb()).collection('users').updateOne({ id }, { $set: updates });
    return this.findUserById(id);
  },
  async deleteUser(id) {
    await (await getDb()).collection('users').deleteOne({ id });
  },

  // QR CODES
  async getQRCodes() {
    return (await getDb()).collection('qr-codes').find().toArray();
  },
  async addQRCode(qr) {
    await (await getDb()).collection('qr-codes').insertOne(qr);
    return qr;
  },
  async saveQRCodes(codes) {
    const col = (await getDb()).collection('qr-codes');
    await col.deleteMany({});
    if (codes.length) await col.insertMany(codes);
  },
  async getRandomActiveQR() {
    const codes = await this.getQRCodes();
    const active = codes.filter(q => q.active);
    if (!active.length) return null;
    return active[Math.floor(Math.random() * active.length)];
  },

  // TRANSACTIONS (Deposits)
  async getTransactions() {
    return (await getDb()).collection('transactions').find().toArray();
  },
  async addTransaction(tx) {
    await (await getDb()).collection('transactions').insertOne(tx);
    return tx;
  },
  async updateTransaction(id, updates) {
    await (await getDb()).collection('transactions').updateOne({ id }, { $set: updates });
    const txs = await this.getTransactions();
    return txs.find(t => t.id === id);
  },
  async deleteTransaction(id) {
    await (await getDb()).collection('transactions').deleteOne({ id });
  },

  // WITHDRAWALS
  async getWithdrawals() {
    return (await getDb()).collection('withdrawals').find().toArray();
  },
  async addWithdrawal(w) {
    await (await getDb()).collection('withdrawals').insertOne(w);
    return w;
  },
  async updateWithdrawal(id, updates) {
    await (await getDb()).collection('withdrawals').updateOne({ id }, { $set: updates });
    const list = await this.getWithdrawals();
    return list.find(w => w.id === id);
  }
};
