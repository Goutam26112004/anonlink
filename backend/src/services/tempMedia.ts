import fs from 'fs';
import path from 'path';
import { prisma } from '../config/db.js';

const TEMP_DIR = path.join(process.cwd(), 'tmp', 'media');
const TTL_SECONDS = 86400; // 24 hours - images remain accessible for a day
const VIEW_ONCE_TTL_SECONDS = 300; // 5 minutes after upload for view-once (gives time to open)
const MAX_SIZE_BYTES = parseInt(process.env.TEMP_MEDIA_MAX_SIZE_BYTES || '5242880');

if (!fs.existsSync(TEMP_DIR)) {
  fs.mkdirSync(TEMP_DIR, { recursive: true });
}

export const TempMediaService = {
  MAX_SIZE_BYTES,
  TTL_SECONDS,

  async saveTemporaryImage(buffer: Buffer, mimeType: string, uploaderUserId: string, roomId: string, viewOnce: boolean = true) {
    if (buffer.length > MAX_SIZE_BYTES) {
      throw new Error(`File too large. Maximum is ${MAX_SIZE_BYTES / 1024 / 1024} MB.`);
    }
    const ext = mimeType.split('/')[1] || 'jpg';
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const filePath = path.join(TEMP_DIR, filename);
    fs.writeFileSync(filePath, buffer);
    const ttl = viewOnce ? VIEW_ONCE_TTL_SECONDS : TTL_SECONDS;
    const expiresAt = new Date(Date.now() + ttl * 1000);
    const record = await prisma.temporaryMedia.create({
      data: { uploaderUserId, roomId, storagePath: filePath, mimeType, sizeBytes: buffer.length, expiresAt, viewOnce }
    });
    return { mediaId: record.id, expiresAt, ttlSeconds: ttl, viewOnce };
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
      where: { id: { in: expired.map((r: any) => r.id) } },
      data: { isDeleted: true }
    });
    return deleted;
  }
};
