import { Router } from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const router = Router();
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

router.get('/reference-prototype', (_req, res) => {
  res.sendFile(path.join(root, 'prototypes', 'crystalline-world', 'salt-basin-crystalline-world-v2.html'));
});

router.get('/reference-prototype/key-visual', (_req, res) => {
  res.sendFile(path.join(root, 'prototypes', 'crystalline-world', 'assets', 'salt-basin-crystalline-world-key-visual-v1.png'));
});

export default router;

