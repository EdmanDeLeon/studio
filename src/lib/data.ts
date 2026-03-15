import type { User, VisitLog, College } from './types';
import { colleges, visitReasons } from './types';
import { PlaceHolderImages } from './placeholder-images';

const userNames = ['John Doe', 'Jane Smith', 'Peter Jones', 'Mary Williams', 'Admin User'];
const userEmails = ['john.doe@neu.edu', 'jane.smith@neu.edu', 'peter.jones@neu.edu', 'mary.williams@neu.edu', 'admin@neu.edu.ph'];

const avatarPlaceholders = PlaceHolderImages.filter(img => img.id.startsWith('avatar-'));

export const mockUsers: User[] = Array.from({ length: 25 }, (_, i) => {
  const name = `${userNames[i % userNames.length]} ${i > 4 ? i : ''}`.trim();
  const email = i < 5 ? userEmails[i] : `${name.toLowerCase().replace(' ', '.')}@neu.edu`;
  
  return {
    id: `NEU-${1001 + i}`,
    name,
    email,
    college: colleges[i % colleges.length],
    role: email.endsWith('@neu.edu.ph') ? 'admin' : 'user',
    status: Math.random() > 0.1 ? 'active' : 'blocked',
    avatarUrl: avatarPlaceholders[i % avatarPlaceholders.length].imageUrl,
  };
});

export const mockAdmin = mockUsers.find(u => u.role === 'admin')!;

export const mockVisitLogs: VisitLog[] = [];

const now = new Date();
for (let i = 0; i < 200; i++) {
  const user = mockUsers[i % mockUsers.length];
  const timestamp = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000); // within last 30 days
  
  mockVisitLogs.push({
    id: `visit-${1001 + i}`,
    userId: user.id,
    reason: visitReasons[i % visitReasons.length],
    timestamp,
  });
}

mockVisitLogs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
