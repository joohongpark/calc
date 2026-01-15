import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import StatisticsCard from '@/components/StatisticsCard';

export default function StatisticsPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background p-3 sm:p-4">
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center gap-2">
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold truncate">통계</h1>
            <p className="text-sm sm:text-base text-muted-foreground truncate">{user?.username}님의 가계부 통계</p>
          </div>
          <div className="flex gap-1 sm:gap-2 flex-shrink-0">
            <Button variant="outline" size="sm" onClick={() => navigate('/')} className="text-xs sm:text-sm">
              홈으로
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout} className="text-xs sm:text-sm">
              로그아웃
            </Button>
          </div>
        </div>

        {/* Statistics */}
        <StatisticsCard />
      </div>
    </div>
  );
}
