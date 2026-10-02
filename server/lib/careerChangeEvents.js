// Career Master change notifications (2026-10-02). Career Master write
// routes emit `changed(userId)`; listeners (QR-shared document history in
// server/lib/applicationPackages.js) react without the routes importing
// them — keeps the dependency one-way and the routes unaware of sharing.
import { EventEmitter } from 'node:events';

export const careerChangeEvents = new EventEmitter();
careerChangeEvents.setMaxListeners(20);

export function notifyCareerChanged(userId) {
  if (userId != null) careerChangeEvents.emit('changed', Number(userId));
}
