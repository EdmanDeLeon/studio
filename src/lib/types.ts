'use client';
import type { Timestamp } from 'firebase/firestore';

export const colleges = [
  'College of Engineering', 
  'College of Arts and Sciences', 
  'College of Business Administration', 
  'College of Education', 
  'College of Computer Studies',
  'College of Law',
  'Faculty'
] as const;

export type College = typeof colleges[number];

export const visitReasons = [
  'Study/Research',
  'Borrow/Return Books',
  'Computer/Internet Access',
  'Printing/Scanning',
  'Quiet Study Area',
  'Group Study',
  'Event/Workshop',
  'Librarian Assistance',
  'General Reading/Leisure',
  'Meeting/Collaboration',
  'Other',
] as const;

export type VisitReason = typeof visitReasons[number];

export type User = {
  id: string;
  qrCodeIdentifier: string;
  firstName: string;
  lastName: string;
  email: string;
  college: College;
  role: 'admin' | 'user';
  isBlocked: boolean;
  avatarUrl: string;
};

export type VisitLog = {
  id: string;
  userId: string;
  reasonForVisit: VisitReason | string;
  entryTime: Timestamp;
  college?: College;
};
