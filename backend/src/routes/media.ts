import { Router, Response, Request } from 'express';
import multer from 'multer';
import { authGuard, RequestWithUser } from '../middleware/auth.js';
import { TempMediaService } from '../services/tempMedia.js';

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: TempMediaService.MAX_SIZE_BYTES },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPEG, PNG, GIF, and WebP images are allowed.'));
    }
  }
});

/**
 * POST /api/v1/media/upload
 * Uploads an image to temporary storage with a 60-second TTL.
 * The roomId must be provided in the body to associate the media with a chat session.
 */
router.post('/upload', authGuard, upload.single('image'), async (req: RequestWithUser, res: Response) => {
  const user = req.user!;

  if (!req.file) {
    return res.status(400).json({ error: 'No image file provided.' });
  }

  const { roomId } = req.body;
  if (!roomId) {
    return res.status(400).json({ error: 'roomId is required.' });
  }

  try {
    const result = await TempMediaService.saveTemporaryImage(
      req.file.buffer,
      req.file.mimetype,
      user.userId,
      roomId
    );
    return res.json({
      mediaId: result.mediaId,
      expiresAt: result.expiresAt,
      ttlSeconds: result.ttlSeconds,
      url: `/api/v1/media/${result.mediaId}`
    });
  } catch (e: any) {
    return res.status(413).json({ error: e.message });
  }
});

/**
 * GET /api/v1/media/:mediaId
 * Serves a temporary image if it has not expired.
 * Returns 410 Gone if the image has expired or been deleted.
 */
router.get('/:mediaId', async (req: Request, res: Response) => {
  const { mediaId } = req.params;

  try {
    const record = await TempMediaService.getMediaIfValid(mediaId);

    if (!record) {
      return res.status(410).json({ error: 'Image has expired or does not exist.' });
    }

    // Security headers to discourage caching and saving
    res.set({
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'Pragma': 'no-cache',
      'X-Content-Type-Options': 'nosniff',
      'Content-Disposition': 'inline'
    });

    return res.sendFile(record.storagePath);
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
});

export default router;
