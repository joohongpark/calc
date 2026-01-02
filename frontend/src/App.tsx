import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import './App.css'

function App() {
  const [health, setHealth] = useState<{ status: string; message: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        setHealth(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Backend connection failed:', err)
        setLoading(false)
      })
  }, [])

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Household Budget</h1>
          <p className="text-muted-foreground">가계부 웹 애플리케이션</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Backend Connection Status</CardTitle>
            <CardDescription>Spring Boot API 연결 상태</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Connecting...</p>
            ) : health ? (
              <div className="space-y-2">
                <p className="text-green-600 font-semibold">✓ Connected</p>
                <p className="text-sm text-muted-foreground">{health.message}</p>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-red-600 font-semibold">✗ Connection Failed</p>
                <p className="text-sm text-muted-foreground">
                  Backend가 실행 중인지 확인해주세요 (http://localhost:8080)
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Start</CardTitle>
            <CardDescription>시작하기</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button>수입 추가</Button>
              <Button variant="outline">지출 추가</Button>
              <Button variant="secondary">통계 보기</Button>
            </div>
            <p className="text-sm text-muted-foreground">
              이것은 보일러플레이트입니다. 실제 기능은 아직 구현되지 않았습니다.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default App
