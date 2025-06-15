import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
      <div className="container mx-auto px-4">
        <Card className="max-w-md mx-auto text-center">
          <CardHeader>
            <CardTitle className="text-6xl font-bold text-gray-900 dark:text-white mb-4">
              404
            </CardTitle>
            <CardTitle className="text-2xl text-gray-700 dark:text-gray-300">
              Page Not Found
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              The page you're looking for doesn't exist or has been moved.
            </p>
            <Link href="/">
              <Button className="w-full">
                Go Back Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}