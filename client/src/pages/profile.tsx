import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Mail, 
  Building, 
  Shield,
  Calendar,
  UserCheck
} from "lucide-react";

export default function Profile() {
  const { faculty } = useAuth();

  if (!faculty) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Loading profile...</p>
      </div>
    );
  }

  const initials = faculty.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase();

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'Super Administrator';
      case 'instructor':
        return 'Instructor';
      default:
        return 'Faculty Member';
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'destructive';
      case 'instructor':
        return 'default';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-2">
          <User className="w-8 h-8" />
          Profile
        </h1>
        <p className="text-lg text-gray-600">
          View your account information and role details
        </p>
      </div>

      {/* Profile Header */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <Avatar className="w-24 h-24">
              <AvatarFallback className="bg-red-600 text-white text-2xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="text-center sm:text-left space-y-2 flex-1">
              <h2 className="text-2xl font-bold text-gray-900">{faculty.name}</h2>
              <p className="text-lg text-gray-600">{faculty.email}</p>
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                <Badge 
                  variant={getRoleBadgeVariant(faculty.role)}
                  className="flex items-center gap-1"
                  data-testid={`badge-role-${faculty.role}`}
                >
                  <Shield className="w-3 h-3" />
                  {getRoleDisplay(faculty.role)}
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <UserCheck className="w-3 h-3" />
                  Active
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Detailed Information */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Account Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Account Information
            </CardTitle>
            <CardDescription>
              Your basic account details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Full Name</p>
                  <p className="text-gray-900" data-testid="text-profile-name">{faculty.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Email Address</p>
                  <p className="text-gray-900" data-testid="text-profile-email">{faculty.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Role</p>
                  <p className="text-gray-900" data-testid="text-profile-role">{getRoleDisplay(faculty.role)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Institutional Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="w-5 h-5" />
              Institution Details
            </CardTitle>
            <CardDescription>
              Your institutional affiliation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Building className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Institution</p>
                  <p className="text-gray-900" data-testid="text-profile-institution">{faculty.institution}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Account Status</p>
                  <p className="text-gray-900">Active Faculty Member</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Information Notice */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <User className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900">Profile Information</h3>
              <p className="text-sm text-blue-700 mt-1">
                This page displays your read-only profile information. To change your password, email, 
                or other account settings, please visit the Settings page from the dropdown menu.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}