import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/dashboard/Sidebar';
import TopBar from '../components/dashboard/TopBar';

export default function DashboardLayout() {
    const [isCollapsed, setIsCollapsed] = useState(false);

    return (
        <div className="flex h-screen bg-background text-foreground overflow-hidden">
            <Sidebar isCollapsed={isCollapsed} />
            <div className="flex flex-col flex-1 h-full min-w-0">
                <TopBar onToggleSidebar={() => setIsCollapsed(!isCollapsed)} />
                <main className="flex-1 overflow-y-auto relative">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
