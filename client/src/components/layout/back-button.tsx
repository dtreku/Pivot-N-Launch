import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default function BackButton() {
  const [location, navigate] = useLocation();
  
  // Hide back button on root pages
  const hideOnPages = ['/', '/dashboard', '/signin'];
  if (hideOnPages.includes(location)) {
    return null;
  }

  const handleBack = () => {
    // Use browser history if available, otherwise navigate to dashboard
    if (window.history.length > 1) {
      window.history.back();
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleBack}
      data-testid="button-back"
      aria-label="Go back to previous page"
      className="mr-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
    >
      <ArrowLeft className="w-4 h-4" />
    </Button>
  );
}