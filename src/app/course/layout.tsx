// Beacon · CNIT 566 Final Project
// Author: Udaya Tejas

import Sidebar from '@/components/layout/Sidebar';

export default function CourseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-[100dvh] overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pt-14 pb-20 md:pt-0 md:pb-0">
        {children}
      </main>
    </div>
  );
}
