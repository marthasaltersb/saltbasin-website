// Routes for the release tracker outside the World Shell:
//   /release-tracker                  signed-in page (admins and members an admin listed)
//   /release-tracker/shared/:token    read-only share link (no sign-in)
import React from 'react';
import { useParams } from 'react-router-dom';
import ReleaseTrackerApp from './ReleaseTrackerApp.jsx';

export function ReleaseTrackerPage() { return <ReleaseTrackerApp />; }
export function SharedReleaseTrackerPage() {
  const { token } = useParams();
  return <ReleaseTrackerApp shareToken={token} />;
}
