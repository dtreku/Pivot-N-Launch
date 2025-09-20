import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronDown, User, LogOut, Settings } from "lucide-react";
import { Link } from "wouter";

export default function FacultyProfile() {
  const { faculty, isLoading, signout } = useAuth();

  if (isLoading || !faculty) {
    return null;
  }

  const initials = faculty.name
    .split(" ")
    .map(n => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleSignout = async () => {
    await signout();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center space-x-3 h-auto p-2">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-red-600 text-white text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="text-left">
            <p className="text-sm font-medium text-gray-800">{faculty.name}</p>
            <p className="text-xs text-gray-500">{faculty.role === 'super_admin' ? 'Super Admin' : 'Instructor'}</p>
          </div>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <div className="px-3 py-2 border-b">
          <p className="text-sm font-medium">{faculty.name}</p>
          <p className="text-xs text-gray-500">{faculty.email}</p>
          <p className="text-xs text-gray-400">{faculty.institution}</p>
        </div>
        <DropdownMenuItem asChild>
          <Link href="/profile" className="flex items-center cursor-pointer" data-testid="link-profile">
            <User className="w-4 h-4 mr-2" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings" className="flex items-center cursor-pointer" data-testid="link-settings">
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignout} className="text-red-600">
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
