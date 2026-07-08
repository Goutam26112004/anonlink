import fs from 'fs';
import path from 'path';
import { prisma } from '../config/db.js';

const TEMP_DIR = path.join(process.cwd(), 'tmp', 'media');
const TTL_SECONDS = 60;
const MAX_SIZE_BYTES = parseInt(process.env.TEMP_MEDIA_MAX_SIZE_BYTES || '5242880');

if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

export const TempMediaService = {
  MAX_SIZE_BYTES,
  TTL_SECONDS,

  async saveTemporaryImage(buffer: Buffer, mimeType: string, uploaderUserId: string, roomId: string) {
    if (buffer.length > MAX_SIZE_BYTES) {
      throw new Error(`File too large. Maximum is ${MAX_SIZE_BYTES / 1024 / 1024} MB.`);
    }
    const ext = mimeType.split('/')[1] || 'jpg';
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const filePath = path.join(TEMP_DIR, filename);
    fs.writeFileSync(filePath, buffer);
    const expiresAt = new Date(Date.now() + TTL_SECONDS * 1000);
    const record = await prisma.temporaryMedia.create({
      data: { uploaderUserId, roomId, storagePath: filePath, mimeType, sizeBytes: buffer.length, expiresAt }
    });
    return { mediaId: record.id, expiresAt, ttlSeconds: TTL_SECONDS };
  },

  async getMediaIfValid(mediaId: string) {
    const record = await prisma.temporaryMedia.findUnique({ where: { id: mediaId } });
    if (!record || record.isDeleted) return null;
    if (new Date() > record.expiresAt) return null;
    return record;
  },

  async cleanupExpiredMedia(): Promise<number> {
    const now = new Date();
    const expired = await prisma.temporaryMedia.findMany({
      where: { isDeleted: false, expiresAt: { lte: now } }
    });
    if (expired.length === 0) return 0;
    let deleted = 0;
    for (const record of expired) {
      try {
        if (fs.existsSync(record.storagePath)) fs.unlinkSync(record.storagePath);
        deleted++;
      } catch (e) {
        console.error(`Failed to delete temp file ${record.storagePath}:`, e);
      }
    }
    await prisma.temporaryMedia.updateMany({
      where: { id: { in: expired.map((r) => r.id) } },
      data: { isDeleted: true }
    });
    return deleted;
  }
};
