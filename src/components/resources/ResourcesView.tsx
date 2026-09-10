import React from 'react';
import { LearnerDriveLibraryTab } from './LearnerDriveLibraryTab.js';

/**
 * Learner Resource Library (Books & Reference Material)
 * Canonical destination for textbooks, NCERTs, official references, and verified learning documents.
 */
export const ResourcesView: React.FC = () => {
  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      <LearnerDriveLibraryTab />
    </div>
  );
};
